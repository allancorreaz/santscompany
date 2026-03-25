<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método inválido.']);
    exit;
}

require_once __DIR__ . '/mail-config.php';

function json_error(string $message, int $status = 400): void
{
    http_response_code($status);
    echo json_encode(['success' => false, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

function build_html_message(string $name, string $email, string $phone, string $message): string
{
    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $safePhone = htmlspecialchars($phone ?: 'Não informado', ENT_QUOTES, 'UTF-8');
    $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8'));
    $safeIp = htmlspecialchars($_SERVER['REMOTE_ADDR'] ?? 'N/A', ENT_QUOTES, 'UTF-8');

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
      <h1 style="margin:0;font-size:28px;line-height:1.2;">Formulário do site Sants Company</h1>
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
      Enviado em {date('d/m/Y H:i:s')} | IP {$safeIp}
    </div>
  </div>
</body>
</html>
HTML;
}

function send_with_mail(string $name, string $email, string $phone, string $message): bool
{
    $subject = 'Novo contato: ' . $name . ' - ' . date('d/m/Y');
    $htmlBody = build_html_message($name, $email, $phone, $message);
    $textBody = "NOVO CONTATO - SANTS COMPANY\n\n"
        . "Nome: {$name}\n"
        . "Email: {$email}\n"
        . "Telefone: " . ($phone ?: 'Não informado') . "\n\n"
        . "Mensagem:\n{$message}\n";

    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: Sants Company <' . FROM_EMAIL . '>',
        'Reply-To: ' . $name . ' <' . $email . '>',
    ];

    return mail(TO_EMAIL, '=?UTF-8?B?' . base64_encode($subject) . '?=', $htmlBody, implode("\r\n", $headers), '-f' . FROM_EMAIL);
}

function verify_recaptcha(string $captchaResponse): bool
{
    if ($captchaResponse === '') {
        return false;
    }

    if (RECAPTCHA_SECRET === '') {
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
    json_error('Preencha os campos obrigatórios.');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_error('Informe um e-mail válido.');
}

$autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
$canUsePhpMailer = file_exists($autoloadPath) && SMTP_HOST !== '' && SMTP_USERNAME !== '' && SMTP_PASSWORD !== '';

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
        $mail->AltBody = "Nome: {$name}\nEmail: {$email}\nTelefone: {$phone}\n\n{$message}";
        $sent = $mail->send();
    } else {
        $sent = send_with_mail($name, $email, $phone, $message);
    }

    if (!$sent) {
        json_error('Não foi possível enviar agora. Tente pelo WhatsApp ou e-mail.', 500);
    }

    echo json_encode([
        'success' => true,
        'message' => 'Mensagem enviada com sucesso. Responderemos em breve.'
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    error_log('Erro no formulário de contato: ' . $exception->getMessage());
    json_error('Não foi possível enviar agora. Tente pelo WhatsApp ou e-mail.', 500);
}
