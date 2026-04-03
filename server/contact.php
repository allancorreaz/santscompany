<?php
declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');

error_reporting(E_ALL);
ini_set('display_errors', '1');

set_exception_handler(function (Throwable $e) {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno no servidor.',
    ], JSON_UNESCAPED_UNICODE);
    error_log('Excecao nao capturada no contact.php: ' . $e->getMessage());
    exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }

    throw new ErrorException($message, 0, $severity, $file, $line);
});

ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Metodo invalido.'], JSON_UNESCAPED_UNICODE);
    exit;
}

require_once __DIR__ . '/mail-config.php';

function clear_output_buffer(): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
}

function json_success(string $message, array $extra = []): void
{
    clear_output_buffer();
    echo json_encode(array_merge([
        'success' => true,
        'message' => $message,
    ], $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

function json_error(string $message, int $status = 400): void
{
    clear_output_buffer();
    http_response_code($status);
    echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function append_submission_log(array $payload): void
{
    $storageDir = __DIR__ . '/storage';
    $storageFile = $storageDir . '/contact-submissions.jsonl';

    if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
        throw new RuntimeException('Nao foi possivel preparar o armazenamento local dos leads.');
    }

    $jsonLine = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($jsonLine === false) {
        throw new RuntimeException('Nao foi possivel serializar o lead para armazenamento local.');
    }

    $written = file_put_contents($storageFile, $jsonLine . PHP_EOL, FILE_APPEND | LOCK_EX);
    if ($written === false) {
        throw new RuntimeException('Nao foi possivel gravar o lead no armazenamento local.');
    }
}

function has_effective_value(string $value, array $invalidValues = []): bool
{
    $trimmed = trim($value);
    if ($trimmed === '') {
        return false;
    }

    return !in_array($trimmed, $invalidValues, true);
}

function is_local_request(): bool
{
    $host = strtolower($_SERVER['HTTP_HOST'] ?? '');
    $serverName = strtolower($_SERVER['SERVER_NAME'] ?? '');
    $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';

    foreach ([$host, $serverName] as $candidate) {
        if ($candidate === '') {
            continue;
        }

        if (str_contains($candidate, 'localhost') || str_contains($candidate, '127.0.0.1')) {
            return true;
        }
    }

    return in_array($remoteAddr, ['127.0.0.1', '::1'], true);
}

function verify_recaptcha(string $captchaResponse): bool
{
    if (is_local_request()) {
        error_log('reCAPTCHA ignorado em ambiente local.');
        return true;
    }

    if ($captchaResponse === '') {
        error_log('reCAPTCHA vazio');
        return false;
    }

    if (!has_effective_value(RECAPTCHA_SECRET, ['6Le_Z6UsAAAAABGcDakFgW0ghkPSpsO9aFdNC1cA'])) {
        return true;
    }

    $postData = http_build_query([
        'secret' => RECAPTCHA_SECRET,
        'response' => $captchaResponse,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    if (function_exists('curl_init')) {
        $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_TIMEOUT => 10,
        ]);

        $result = curl_exec($ch);
        if ($result === false) {
            error_log('Erro cURL no reCAPTCHA: ' . curl_error($ch));
            curl_close($ch);
            return false;
        }
        curl_close($ch);
    } else {
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'content' => $postData,
                'timeout' => 10,
            ],
        ]);

        $result = file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
        if ($result === false) {
            error_log('Fallback HTTP do reCAPTCHA falhou');
            return false;
        }
    }

    $decoded = json_decode($result, true);
    if (!$decoded) {
        error_log('Resposta invalida do Google: ' . $result);
        return false;
    }

    if (!($decoded['success'] ?? false)) {
        error_log('reCAPTCHA falhou: ' . json_encode($decoded));
        return false;
    }

    $action = $decoded['action'] ?? '';
    $score = (float) ($decoded['score'] ?? 0);

    if ($action !== '' && $action !== 'contact_form_submit') {
        error_log('reCAPTCHA action invalida: ' . $action);
        return false;
    }

    if (array_key_exists('score', $decoded) && $score < 0.5) {
        error_log('reCAPTCHA score baixo: ' . $score);
        return false;
    }

    return true;
}

function build_service_display(string $serviceType, string $otherService): string
{
    $serviceDisplay = $serviceType !== '' ? htmlspecialchars($serviceType, ENT_QUOTES, 'UTF-8') : '(nao informado)';
    if ($otherService !== '') {
        $serviceDisplay .= ' - ' . htmlspecialchars($otherService, ENT_QUOTES, 'UTF-8');
    }

    return $serviceDisplay;
}

function build_mailer_instance(
    string $name,
    string $email,
    string $phone,
    string $message,
    string $serviceDisplay,
    array $transport
): PHPMailer\PHPMailer\PHPMailer {
    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $transport['host'];
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = $transport['secure'];
    $mail->Port = $transport['port'];
    $mail->CharSet = 'UTF-8';
    $mail->Encoding = 'base64';
    $mail->SMTPKeepAlive = false;
    $mail->SMTPAutoTLS = true;
    $mail->Timeout = 15;
    $mail->addCustomHeader('X-Mailer', 'PHP/' . phpversion());
    $mail->WordWrap = 998;
    $mail->SMTPOptions = [
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ],
    ];

    $mail->setFrom(FROM_EMAIL, 'Sants Company - Contato');
    $mail->addAddress(TO_EMAIL, 'Sants Company');
    $mail->addReplyTo($email, $name);
    $mail->isHTML(true);
    $mail->Subject = 'Novo contato: ' . $name . ' - ' . date('d/m/Y H:i');

    $htmlBody = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;"><div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;"><div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff; padding: 30px 20px; text-align: center;"><h1 style="margin: 0; font-size: 24px; font-weight: 600;">Novo Contato Recebido</h1><p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">De ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</p></div><div style="padding: 30px 20px;"><div style="margin-bottom: 25px;"><h2 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #0052cc; text-transform: uppercase; letter-spacing: 1px;">Informacoes de Contato</h2><div style="padding: 12px; background-color: #f9f9fb; border-left: 4px solid #0052cc; margin-bottom: 10px;"><p style="margin: 0; font-size: 13px; color: #666;"><strong>Nome:</strong> ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</p></div><div style="padding: 12px; background-color: #f9f9fb; border-left: 4px solid #0052cc; margin-bottom: 10px;"><p style="margin: 0; font-size: 13px; color: #666;"><strong>Email:</strong> <a href="mailto:' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '" style="color: #0052cc; text-decoration: none;">' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</a></p></div><div style="padding: 12px; background-color: #f9f9fb; border-left: 4px solid #0052cc; margin-bottom: 10px;"><p style="margin: 0; font-size: 13px; color: #666;"><strong>Telefone:</strong> ' . ($phone !== '' ? htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') : '<em style="color: #999;">Nao informado</em>') . '</p></div><div style="padding: 12px; background-color: #f9f9fb; border-left: 4px solid #0052cc;"><p style="margin: 0; font-size: 13px; color: #666;"><strong>Servico Solicitado:</strong> ' . $serviceDisplay . '</p></div></div><div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e5e5;"><h2 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #0052cc; text-transform: uppercase; letter-spacing: 1px;">Mensagem</h2><div style="background-color: #f9f9fb; padding: 15px; border-radius: 6px; line-height: 1.8;"><p style="margin: 0; font-size: 14px; color: #333; white-space: pre-wrap; word-wrap: break-word;">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p></div></div></div><div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;"><p style="margin: 0; font-size: 12px; color: #999;">Email automatico do formulario de contato<br>Sants Company - ' . date('d/m/Y H:i:s') . '</p></div></div></body></html>';
    $mail->Body = $htmlBody;

    $plainBody = "NOVO CONTATO RECEBIDO\n";
    $plainBody .= str_repeat("=", 50) . "\n\n";
    $plainBody .= "Nome: " . $name . "\n";
    $plainBody .= "Email: " . $email . "\n";
    $plainBody .= "Telefone: " . ($phone !== '' ? $phone : '(nao informado)') . "\n";
    $plainBody .= "Servico: " . strip_tags($serviceDisplay) . "\n\n";
    $plainBody .= str_repeat("-", 50) . "\n";
    $plainBody .= "MENSAGEM:\n\n";
    $plainBody .= $message . "\n\n";
    $plainBody .= str_repeat("-", 50) . "\n";
    $plainBody .= "Data/Hora: " . date('d/m/Y H:i:s') . "\n";
    $mail->AltBody = $plainBody;

    return $mail;
}

function send_with_transport_fallback(
    string $name,
    string $email,
    string $phone,
    string $message,
    string $serviceDisplay
): array {
    $transports = [
        [
            'label' => 'zoho-tls-587',
            'host' => SMTP_HOST,
            'port' => (int) SMTP_PORT,
            'secure' => PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS,
        ],
        [
            'label' => 'zoho-ssl-465',
            'host' => SMTP_HOST,
            'port' => 465,
            'secure' => PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS,
        ],
    ];

    $errors = [];

    foreach ($transports as $transport) {
        try {
            $mail = build_mailer_instance($name, $email, $phone, $message, $serviceDisplay, $transport);
            if ($mail->send()) {
                return [
                    'sent' => true,
                    'transport' => $transport['label'],
                ];
            }

            $errors[] = $transport['label'] . ': transporte nao confirmou o envio';
        } catch (Throwable $exception) {
            $errors[] = $transport['label'] . ': ' . $exception->getMessage();
        }
    }

    return [
        'sent' => false,
        'transport' => null,
        'error' => implode(' | ', $errors),
    ];
}

$honeypot = trim($_POST['company'] ?? '');
if ($honeypot !== '') {
    json_error('Envio bloqueado.', 422);
}

$captchaResponse = trim($_POST['g-recaptcha-response'] ?? '');
if (!verify_recaptcha($captchaResponse)) {
    json_error('Falha na verificacao do reCAPTCHA.', 422);
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$serviceType = trim($_POST['serviceType'] ?? '');
$otherService = trim($_POST['otherService'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    json_error('Preencha os campos obrigatorios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Informe um e-mail valido.');
}

$submissionData = [
    'received_at' => date(DATE_ATOM),
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'service' => $serviceType,
    'otherService' => $otherService,
    'message' => $message,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
];

$smtpConfigured = has_effective_value(SMTP_HOST)
    && has_effective_value(SMTP_USERNAME)
    && has_effective_value(SMTP_PASSWORD);

$autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
$canUsePhpMailer = file_exists($autoloadPath) && $smtpConfigured;

try {
    if (!$canUsePhpMailer) {
        throw new RuntimeException('O envio de e-mail nao esta configurado corretamente.');
    }

    require_once $autoloadPath;

    $serviceDisplay = build_service_display($serviceType, $otherService);
    $sendResult = send_with_transport_fallback($name, $email, $phone, $message, $serviceDisplay);

    if (!$sendResult['sent']) {
        throw new RuntimeException($sendResult['error'] ?? 'Falha desconhecida no SMTP.');
    }

    append_submission_log(array_merge($submissionData, [
        'delivery' => 'email',
        'delivery_status' => 'sent',
        'transport' => $sendResult['transport'] ?? 'smtp',
        'date' => date('d/m/Y H:i:s'),
    ]));

    json_success('Mensagem enviada com sucesso.', [
        'delivery' => 'email',
        'transport' => $sendResult['transport'] ?? 'smtp',
    ]);
} catch (Throwable $exception) {
    error_log('Erro no formulario de contato: ' . $exception->getMessage());

    try {
        append_submission_log(array_merge($submissionData, [
            'delivery' => 'local_storage',
            'delivery_status' => 'failed_email',
            'date' => date('d/m/Y H:i:s'),
            'reason' => $exception->getMessage(),
        ]));

        json_error('Lead salvo localmente, mas houve falha no envio por e-mail.', 500);
    } catch (Throwable $storageException) {
        error_log('Erro ao salvar lead localmente: ' . $storageException->getMessage());
        json_error('Erro ao enviar.', 500);
    }
}
