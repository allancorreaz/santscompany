<?php
declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');

error_reporting(E_ALL);
ini_set('display_errors', '0');

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

// ─── Helpers ────────────────────────────────────────────────────────────────

function clear_output_buffer(): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
}

function json_success(string $message, array $extra = []): void
{
    clear_output_buffer();
    echo json_encode(array_merge(['success' => true, 'message' => $message], $extra), JSON_UNESCAPED_UNICODE);
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
    $storageDir  = __DIR__ . '/storage';
    $storageFile = $storageDir . '/contact-submissions.jsonl';

    if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
        throw new RuntimeException('Nao foi possivel preparar o armazenamento local dos leads.');
    }

    $jsonLine = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($jsonLine === false) {
        throw new RuntimeException('Nao foi possivel serializar o lead.');
    }

    if (file_put_contents($storageFile, $jsonLine . PHP_EOL, FILE_APPEND | LOCK_EX) === false) {
        throw new RuntimeException('Nao foi possivel gravar o lead no armazenamento local.');
    }
}

function has_effective_value(string $value, array $invalidValues = []): bool
{
    $trimmed = trim($value);
    return $trimmed !== '' && !in_array($trimmed, $invalidValues, true);
}

function is_local_request(): bool
{
    $host       = strtolower($_SERVER['HTTP_HOST'] ?? '');
    $serverName = strtolower($_SERVER['SERVER_NAME'] ?? '');
    $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '';

    foreach ([$host, $serverName] as $candidate) {
        if ($candidate === '') continue;
        if (str_contains($candidate, 'localhost') || str_contains($candidate, '127.0.0.1')) {
            return true;
        }
    }

    return in_array($remoteAddr, ['127.0.0.1', '::1'], true);
}

// ─── reCAPTCHA v3 ───────────────────────────────────────────────────────────

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
        'secret'   => RECAPTCHA_SECRET,
        'response' => $captchaResponse,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    if (function_exists('curl_init')) {
        $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $postData,
            CURLOPT_TIMEOUT        => 10,
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
                'method'  => 'POST',
                'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
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
    $score  = (float) ($decoded['score'] ?? 0);

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

// ─── Resend API ──────────────────────────────────────────────────────────────

function send_via_resend(
    string $name,
    string $email,
    string $phone,
    string $message,
    string $serviceDisplay
): array {
    $apiKey = defined('RESEND_API_KEY') ? RESEND_API_KEY : '';

    if ($apiKey === '') {
        return ['sent' => false, 'error' => 'RESEND_API_KEY nao configurada.'];
    }

    $subject = 'Novo contato: ' . $name . ' - ' . date('d/m/Y H:i');

    $htmlBody = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head><body style="font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f5f5f5;">'
        . '<div style="max-width:600px;margin:20px auto;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1);overflow:hidden;">'
        . '<div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#fff;padding:30px 20px;text-align:center;">'
        . '<h1 style="margin:0;font-size:24px;font-weight:600;">Novo Contato Recebido</h1>'
        . '<p style="margin:8px 0 0;font-size:14px;opacity:.9;">De ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</p>'
        . '</div>'
        . '<div style="padding:30px 20px;">'
        . '<h2 style="margin:0 0 15px;font-size:14px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;">Informações de Contato</h2>'
        . '<div style="padding:12px;background:#f9f9fb;border-left:4px solid #7c3aed;margin-bottom:10px;"><p style="margin:0;font-size:13px;color:#666;"><strong>Nome:</strong> ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</p></div>'
        . '<div style="padding:12px;background:#f9f9fb;border-left:4px solid #7c3aed;margin-bottom:10px;"><p style="margin:0;font-size:13px;color:#666;"><strong>Email:</strong> <a href="mailto:' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '" style="color:#7c3aed;">' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</a></p></div>'
        . '<div style="padding:12px;background:#f9f9fb;border-left:4px solid #7c3aed;margin-bottom:10px;"><p style="margin:0;font-size:13px;color:#666;"><strong>Telefone:</strong> ' . ($phone !== '' ? htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') : '<em style="color:#999;">Não informado</em>') . '</p></div>'
        . '<div style="padding:12px;background:#f9f9fb;border-left:4px solid #7c3aed;"><p style="margin:0;font-size:13px;color:#666;"><strong>Serviço:</strong> ' . $serviceDisplay . '</p></div>'
        . '<div style="margin-top:25px;padding-top:20px;border-top:1px solid #e5e5e5;">'
        . '<h2 style="margin:0 0 15px;font-size:14px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:1px;">Mensagem</h2>'
        . '<div style="background:#f9f9fb;padding:15px;border-radius:6px;"><p style="margin:0;font-size:14px;color:#333;white-space:pre-wrap;word-wrap:break-word;">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p></div>'
        . '</div></div>'
        . '<div style="background:#f5f5f5;padding:20px;text-align:center;border-top:1px solid #e5e5e5;">'
        . '<p style="margin:0;font-size:12px;color:#999;">Email automático · Sants Company · ' . date('d/m/Y H:i:s') . '</p>'
        . '</div></div></body></html>';

    $plainBody = "NOVO CONTATO RECEBIDO\n"
        . str_repeat('=', 50) . "\n\n"
        . "Nome: $name\n"
        . "Email: $email\n"
        . "Telefone: " . ($phone !== '' ? $phone : '(não informado)') . "\n"
        . "Serviço: " . strip_tags($serviceDisplay) . "\n\n"
        . str_repeat('-', 50) . "\n"
        . "MENSAGEM:\n\n$message\n\n"
        . str_repeat('-', 50) . "\n"
        . 'Data/Hora: ' . date('d/m/Y H:i:s') . "\n";

    $payload = json_encode([
        'from'     => 'Sants Company <contato@santscompany.com>',
        'to'       => ['contato@santscompany.com'],
        'reply_to' => $email,
        'subject'  => $subject,
        'html'     => $htmlBody,
        'text'     => $plainBody,
    ], JSON_UNESCAPED_UNICODE);

    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 15,
    ]);

    $response   = curl_exec($ch);
    $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError  = curl_error($ch);
    curl_close($ch);

    if ($response === false) {
        return ['sent' => false, 'error' => 'cURL falhou: ' . $curlError];
    }

    $decoded = json_decode($response, true);

    if ($httpCode === 200 || $httpCode === 201) {
        return ['sent' => true, 'id' => $decoded['id'] ?? null];
    }

    $errorMsg = $decoded['message'] ?? $decoded['error'] ?? $response;
    return ['sent' => false, 'error' => 'Resend HTTP ' . $httpCode . ': ' . $errorMsg];
}

// ─── Honeypot ────────────────────────────────────────────────────────────────

$honeypot = trim($_POST['company'] ?? '');
if ($honeypot !== '') {
    json_error('Envio bloqueado.', 422);
}

// ─── reCAPTCHA ───────────────────────────────────────────────────────────────

$captchaResponse = trim($_POST['g-recaptcha-response'] ?? '');
if (!verify_recaptcha($captchaResponse)) {
    json_error('Falha na verificacao do reCAPTCHA.', 422);
}

// ─── Campos do formulário ────────────────────────────────────────────────────

$name         = trim($_POST['name'] ?? '');
$email        = trim($_POST['email'] ?? '');
$phone        = trim($_POST['phone'] ?? '');
$serviceType  = trim($_POST['serviceType'] ?? '');
$otherService = trim($_POST['otherService'] ?? '');
$message      = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    json_error('Preencha os campos obrigatórios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Informe um e-mail válido.');
}

$serviceDisplay = $serviceType !== ''
    ? htmlspecialchars($serviceType, ENT_QUOTES, 'UTF-8')
    : '(não informado)';

if ($otherService !== '') {
    $serviceDisplay .= ' - ' . htmlspecialchars($otherService, ENT_QUOTES, 'UTF-8');
}

// ─── Log local ───────────────────────────────────────────────────────────────

$submissionData = [
    'received_at'  => date(DATE_ATOM),
    'name'         => $name,
    'email'        => $email,
    'phone'        => $phone,
    'service'      => $serviceType,
    'otherService' => $otherService,
    'message'      => $message,
    'ip'           => $_SERVER['REMOTE_ADDR'] ?? '',
    'user_agent'   => $_SERVER['HTTP_USER_AGENT'] ?? '',
];

// ─── Envio via Resend ────────────────────────────────────────────────────────

try {
    $result = send_via_resend($name, $email, $phone, $message, $serviceDisplay);

    if (!$result['sent']) {
        throw new RuntimeException($result['error'] ?? 'Falha desconhecida no Resend.');
    }

    append_submission_log(array_merge($submissionData, [
        'delivery'        => 'resend',
        'delivery_status' => 'sent',
        'resend_id'       => $result['id'] ?? null,
        'date'            => date('d/m/Y H:i:s'),
    ]));

    json_success('Mensagem enviada com sucesso.', ['delivery' => 'resend']);

} catch (Throwable $exception) {
    error_log('Erro no formulario de contato: ' . $exception->getMessage());

    try {
        append_submission_log(array_merge($submissionData, [
            'delivery'        => 'local_storage',
            'delivery_status' => 'failed_email',
            'date'            => date('d/m/Y H:i:s'),
            'reason'          => $exception->getMessage(),
        ]));

        json_error('Houve uma falha no envio. Tente novamente ou entre em contato pelo WhatsApp.', 500);
    } catch (Throwable $storageException) {
        error_log('Erro ao salvar lead localmente: ' . $storageException->getMessage());
        json_error('Erro ao enviar.', 500);
    }
}