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

// ✅ CORREÇÃO: não quebrar tudo com warning
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

/* ========================= HELPERS ========================= */

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

/* ========================= RECAPTCHA (FIX COMPLETO) ========================= */

function verify_recaptcha(string $captchaResponse): bool
{
    if ($captchaResponse === '') {
        error_log('reCAPTCHA vazio');
        return false;
    }

    if (!has_effective_value(RECAPTCHA_SECRET, ['SEU_RECAPTCHA_SECRET_AQUI'])) {
        return true; // modo dev
    }

    $postData = http_build_query([
        'secret' => RECAPTCHA_SECRET,
        'response' => $captchaResponse,
        'remoteip' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    // ✅ tenta cURL primeiro
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
            error_log('Erro cURL: ' . curl_error($ch));
            curl_close($ch);
            return false;
        }

        curl_close($ch);

    } else {
        // ✅ fallback corrigido (sem erro 400)
        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-type: application/x-www-form-urlencoded\r\n",
                'content' => $postData,
                'timeout' => 10,
            ],
        ]);

        $result = file_get_contents(
            'https://www.google.com/recaptcha/api/siteverify',
            false,
            $context
        );

        if ($result === false) {
            error_log('Fallback HTTP falhou');
            return false;
        }
    }

    $decoded = json_decode($result, true);

    if (!$decoded) {
        error_log('Resposta inválida do Google: ' . $result);
        return false;
    }

    if (!($decoded['success'] ?? false)) {
        error_log('reCAPTCHA falhou: ' . json_encode($decoded));
    }

    return (bool) ($decoded['success'] ?? false);
}

/* ========================= RESTO DO SEU CÓDIGO (INALTERADO) ========================= */

$honeypot = trim($_POST['company'] ?? '');
if ($honeypot !== '') {
    json_error('Envio bloqueado.', 422);
}

$captchaResponse = trim($_POST['g-recaptcha-response'] ?? '');

try {
    $captchaValid = verify_recaptcha($captchaResponse);
} catch (Throwable $e) {
    error_log('Erro reCAPTCHA: ' . $e->getMessage());
    $captchaValid = false;
}

if (!$captchaValid) {
    json_error('Falha na verificação do reCAPTCHA.', 422);
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

/* ========================= ENVIO ORIGINAL ========================= */

$smtpConfigured = has_effective_value(SMTP_HOST)
    && has_effective_value(SMTP_USERNAME)
    && has_effective_value(SMTP_PASSWORD, ['Q8SkbE1Lp3yG']);

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
        $mail->Body = $message;
        $mail->AltBody = $message;
        $sent = $mail->send();

    } elseif ($smtpConfigured) {
        $sent = send_with_smtp($name, $email, $phone, $message);
    } else {
        $sent = send_with_mail($name, $email, $phone, $message);
    }

    if (!$sent) {
        throw new RuntimeException('O transporte de e-mail nao confirmou o envio.');
    }

    json_success('Mensagem enviada com sucesso.', [
        'delivery' => 'email',
    ]);

} catch (Throwable $exception) {
    error_log('Erro no formulario de contato: ' . $exception->getMessage());
    json_error('Erro ao enviar.', 500);
}