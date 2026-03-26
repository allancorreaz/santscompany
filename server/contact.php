<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '1');
set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno no servidor.',
        'error' => $e->getMessage(),
    ], JSON_UNESCAPED_UNICODE);
    error_log('Exceção não capturada no contact.php: ' . $e->getMessage());
    exit;
});
set_error_handler(function ($severity, $message, $file, $line) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno no servidor.',
        'error' => $message . ' em ' . $file . ':' . $line,
    ], JSON_UNESCAPED_UNICODE);
    error_log('Erro não capturado no contact.php: ' . $message . ' em ' . $file . ':' . $line);
    exit;
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

function has_effective_value(string $value, array $invalidValues = []): bool
{
    $trimmed = trim($value);
    if ($trimmed === '') {
        return false;
    }

    return !in_array($trimmed, $invalidValues, true);
}

function build_html_message(string $name, string $email, string $phone, string $message): string
{
    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $safePhone = htmlspecialchars($phone !== '' ? $phone : 'Nao informado', ENT_QUOTES, 'UTF-8');
    $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
    $safeIp = htmlspecialchars($_SERVER['REMOTE_ADDR'] ?? 'N/A', ENT_QUOTES, 'UTF-8');
    $sentAt = date('d/m/Y H:i:s');

    return <<<HTML
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
</head>
<body style="margin:0;padding:24px;background:#f4f7fb;font-family:Arial,sans-serif;color:#0f172a;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dbe3ef;">
    <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#ffffff;">
      <p style="margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;opacity:.8;">Novo contato</p>
      <h1 style="margin:0;font-size:28px;line-height:1.2;">Formulario do site Sants Company</h1>
    </div>
    <div style="padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;font-size:15px;">
        <tr>
          <td style="padding:12px 0;font-weight:700;width:140px;">Nome</td>
          <td style="padding:12px 0;">{$safeName}</td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-weight:700;">Email</td>
          <td style="padding:12px 0;"><a href="mailto:{$safeEmail}" style="color:#2563eb;text-decoration:none;">{$safeEmail}</a></td>
        </tr>
        <tr>
          <td style="padding:12px 0;font-weight:700;">Telefone</td>
          <td style="padding:12px 0;">{$safePhone}</td>
        </tr>
      </table>
      <div style="margin-top:24px;padding:18px 20px;background:#f8fafc;border-left:4px solid #2563eb;border-radius:10px;">
        <p style="margin:0 0 10px;font-weight:700;">Mensagem</p>
        <div style="color:#334155;line-height:1.7;">{$safeMessage}</div>
      </div>
    </div>
    <div style="padding:18px 32px;background:#f8fafc;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">
      Enviado em {$sentAt} | IP {$safeIp}
    </div>
  </div>
</body>
</html>
HTML;
}

function build_text_message(string $name, string $email, string $phone, string $message): string
{
    $safePhone = $phone !== '' ? $phone : 'Nao informado';

    return "NOVO CONTATO - SANTS COMPANY\n\n"
        . "Nome: {$name}\n"
        . "Email: {$email}\n"
        . "Telefone: {$safePhone}\n\n"
        . "Mensagem:\n{$message}\n";
}

function encode_header(string $value): string
{
    return '=?UTF-8?B?' . base64_encode($value) . '?=';
}

function smtp_read_response($socket, array $allowedCodes): string
{
    $response = '';

    while (!feof($socket)) {
        $line = fgets($socket, 515);
        if ($line === false) {
            break;
        }

        $response .= $line;

        if (isset($line[3]) && $line[3] === ' ') {
            break;
        }
    }

    $statusCode = (int) substr($response, 0, 3);
    if (!in_array($statusCode, $allowedCodes, true)) {
        throw new RuntimeException('SMTP respondeu com erro: ' . trim($response));
    }

    return $response;
}

function smtp_write_command($socket, string $command, array $allowedCodes): string
{
    fwrite($socket, $command . "\r\n");
    return smtp_read_response($socket, $allowedCodes);
}

function build_mime_message(string $name, string $email, string $phone, string $message): string
{
    $subject = 'Novo contato: ' . $name . ' - ' . date('d/m/Y');
    $htmlBody = build_html_message($name, $email, $phone, $message);
    $textBody = build_text_message($name, $email, $phone, $message);
    $boundary = 'bnd_' . bin2hex(random_bytes(12));

    $headers = [
        'From: Sants Company <' . FROM_EMAIL . '>',
        'Reply-To: ' . $name . ' <' . $email . '>',
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    ];

    $body = [];
    $body[] = 'Subject: ' . encode_header($subject);
    $body = array_merge($body, $headers);
    $body[] = '';
    $body[] = '--' . $boundary;
    $body[] = 'Content-Type: text/plain; charset=UTF-8';
    $body[] = 'Content-Transfer-Encoding: 8bit';
    $body[] = '';
    $body[] = $textBody;
    $body[] = '--' . $boundary;
    $body[] = 'Content-Type: text/html; charset=UTF-8';
    $body[] = 'Content-Transfer-Encoding: 8bit';
    $body[] = '';
    $body[] = $htmlBody;
    $body[] = '--' . $boundary . '--';
    $body[] = '';

    $payload = implode("\r\n", $body);
    return preg_replace("/(?m)^\./", '..', $payload) ?? $payload;
}

function send_with_smtp(string $name, string $email, string $phone, string $message): bool
{
    $socket = @stream_socket_client(
        'tcp://' . SMTP_HOST . ':' . SMTP_PORT,
        $errorNumber,
        $errorString,
        15,
        STREAM_CLIENT_CONNECT
    );

    if (!$socket) {
        throw new RuntimeException('Falha ao conectar no SMTP: ' . $errorString . ' (' . $errorNumber . ')');
    }

    stream_set_timeout($socket, 15);
    $localHost = gethostname() ?: 'localhost';

    try {
        smtp_read_response($socket, [220]);
        smtp_write_command($socket, 'EHLO ' . $localHost, [250]);

        if ((int) SMTP_PORT === 587) {
            smtp_write_command($socket, 'STARTTLS', [220]);

            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new RuntimeException('Nao foi possivel ativar STARTTLS para o SMTP.');
            }

            smtp_write_command($socket, 'EHLO ' . $localHost, [250]);
        }

        smtp_write_command($socket, 'AUTH LOGIN', [334]);
        smtp_write_command($socket, base64_encode(SMTP_USERNAME), [334]);
        smtp_write_command($socket, base64_encode(SMTP_PASSWORD), [235]);
        smtp_write_command($socket, 'MAIL FROM:<' . FROM_EMAIL . '>', [250]);
        smtp_write_command($socket, 'RCPT TO:<' . TO_EMAIL . '>', [250, 251]);
        smtp_write_command($socket, 'DATA', [354]);

        fwrite($socket, build_mime_message($name, $email, $phone, $message) . "\r\n.\r\n");
        smtp_read_response($socket, [250]);
        smtp_write_command($socket, 'QUIT', [221]);
        fclose($socket);

        return true;
    } catch (Throwable $exception) {
        fclose($socket);
        throw $exception;
    }
}

function send_with_mail(string $name, string $email, string $phone, string $message): bool
{
    $subject = 'Novo contato: ' . $name . ' - ' . date('d/m/Y');
    $htmlBody = build_html_message($name, $email, $phone, $message);
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: Sants Company <' . FROM_EMAIL . '>',
        'Reply-To: ' . $name . ' <' . $email . '>',
    ];

    set_error_handler(static function (int $severity, string $warningMessage): never {
        throw new RuntimeException($warningMessage);
    });

    try {
        return mail(
            TO_EMAIL,
            encode_header($subject),
            $htmlBody,
            implode("\r\n", $headers),
            '-f' . FROM_EMAIL
        );
    } finally {
        restore_error_handler();
    }
}

function persist_submission(string $name, string $email, string $phone, string $message, string $reason): void
{
    $storageDir = __DIR__ . '/storage';
    if (!is_dir($storageDir) && !mkdir($storageDir, 0775, true) && !is_dir($storageDir)) {
        throw new RuntimeException('Nao foi possivel preparar o diretorio de armazenamento local.');
    }

    $payload = [
        'received_at' => date(DATE_ATOM),
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'message' => $message,
        'delivery_fallback' => 'local_storage',
        'reason' => $reason,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null,
    ];

    $result = file_put_contents(
        $storageDir . '/contact-submissions.jsonl',
        json_encode($payload, JSON_UNESCAPED_UNICODE) . PHP_EOL,
        FILE_APPEND | LOCK_EX
    );

    if ($result === false) {
        throw new RuntimeException('Nao foi possivel salvar o contato localmente.');
    }
}

function verify_recaptcha(string $captchaResponse): bool
{
    if ($captchaResponse === '') {
        return false;
    }

    if (!has_effective_value(RECAPTCHA_SECRET, ['SEU_RECAPTCHA_SECRET_AQUI'])) {
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
        $result = @file_get_contents('https://www.google.com/recaptcha/api/siteverify', false, $context);
    }

    if (!$result) {
        return false;
    }

    $decoded = json_decode($result, true);
    return (bool) ($decoded['success'] ?? false);
}

$honeypot = trim($_POST['company'] ?? '');
if ($honeypot !== '') {
    json_error('Envio bloqueado.', 422);
}

$captchaResponse = trim($_POST['g-recaptcha-response'] ?? '');
if (!verify_recaptcha($captchaResponse)) {
    json_error('Confirme o reCAPTCHA antes de enviar.', 422);
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$message = trim($_POST['message'] ?? '');

if ($name === '' || $email === '' || $message === '') {
    json_error('Preencha os campos obrigatorios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Informe um e-mail valido.');
}

$smtpConfigured = has_effective_value(SMTP_HOST)
    && has_effective_value(SMTP_USERNAME)
    && has_effective_value(SMTP_PASSWORD, ['SUA_SENHA_AQUI']);

$autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
$canUsePhpMailer = file_exists($autoloadPath) && $smtpConfigured;

try {
    $sent = false;

    if ($canUsePhpMailer) {
        require_once $autoloadPath;

        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host = SMTP_HOST;
        $mail->SMTPAuth = true;
        $mail->Username = SMTP_USERNAME;
        $mail->Password = SMTP_PASSWORD;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = SMTP_PORT;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom(FROM_EMAIL, 'Sants Company');
        $mail->addAddress(TO_EMAIL, 'Sants Company');
        $mail->addReplyTo($email, $name);
        $mail->isHTML(true);
        $mail->Subject = 'Novo contato: ' . $name . ' - ' . date('d/m/Y');
        $mail->Body = build_html_message($name, $email, $phone, $message);
        $mail->AltBody = build_text_message($name, $email, $phone, $message);
        $sent = $mail->send();
    } elseif ($smtpConfigured) {
        $sent = send_with_smtp($name, $email, $phone, $message);
    } else {
        $sent = send_with_mail($name, $email, $phone, $message);
    }

    if (!$sent) {
        throw new RuntimeException('O transporte de e-mail nao confirmou o envio.');
    }

    json_success('Mensagem enviada com sucesso. Responderemos em breve.', [
        'delivery' => 'email',
    ]);
} catch (Throwable $exception) {
    error_log('Erro no formulario de contato: ' . $exception->getMessage());

    try {
        persist_submission($name, $email, $phone, $message, $exception->getMessage());
        json_success('Mensagem recebida com sucesso. Nosso envio por e-mail esta em manutencao, mas seu contato foi registrado.', [
            'delivery' => 'local_storage',
        ]);
    } catch (Throwable $storageException) {
        error_log('Erro ao salvar fallback do formulario: ' . $storageException->getMessage());
        json_error('Nao foi possivel enviar agora. Tente novamente em alguns minutos ou use outro canal.', 500);
    }
}
