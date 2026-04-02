<?php
declare(strict_types=1);

error_reporting(E_ALL);
ini_set('display_errors', '1');

set_exception_handler(function ($e) {
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
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
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
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

    if (!has_effective_value(RECAPTCHA_SECRET, ['6Lef96IsAAAAACIXBe7Uz9lrnOslrhurO2Jxn8HY'])) {
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
$serviceType = trim($_POST['serviceType'] ?? '');
$otherService = trim($_POST['otherService'] ?? '');
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
    && has_effective_value(SMTP_PASSWORD);

$autoloadPath = dirname(__DIR__) . '/vendor/autoload.php';
$canUsePhpMailer = file_exists($autoloadPath) && $smtpConfigured;

try {
    $sent = false;

    if ($canUsePhpMailer) {
        // ✅ CORPO DO EMAIL COM TODAS AS INFORMAÇÕES
        $serviceDisplay = $serviceType ? htmlspecialchars($serviceType) : '(não informado)';
        if ($otherService) {
            $serviceDisplay .= ' - ' . htmlspecialchars($otherService);
        }

        // 🚀 ENVIAR REAL VIA SMTP
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
        $mail->Encoding = 'base64';
        
        // ✅ Configurações extras para Zoho
        $mail->SMTPKeepAlive = false;
        $mail->SMTPAutoTLS = true;
        $mail->addCustomHeader('X-Mailer', 'PHP/' . phpversion());
        $mail->WordWrap = 998;  // Evita quebras de linha nos headers

        // ✅ REMETENTE: Email confirmado do Zoho | REPLY-TO: Email do usuário
        $mail->setFrom(FROM_EMAIL, 'Sants Company - Contato');
        $mail->addAddress(TO_EMAIL, 'Sants Company');
        $mail->addReplyTo($email, $name);  // Cliente pode responder para seu email
        
        $mail->isHTML(true);
        $mail->Subject = 'Novo contato: ' . $name . ' - ' . date('d/m/Y H:i');
        
        // ✅ HTML COM DESIGN PROFISSIONAL
        $htmlBody = '<!DOCTYPE html>';
        $htmlBody .= '<html lang="pt-BR">';
        $htmlBody .= '<head>';
        $htmlBody .= '<meta charset="UTF-8">';
        $htmlBody .= '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        $htmlBody .= '</head>';
        $htmlBody .= '<body style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, \'Helvetica Neue\', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">';
        
        // Container
        $htmlBody .= '<div style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">';
        
        // Header
        $htmlBody .= '<div style="background: linear-gradient(135deg, #0052cc 0%, #0066ff 100%); color: #ffffff; padding: 30px 20px; text-align: center;">';
        $htmlBody .= '<h1 style="margin: 0; font-size: 24px; font-weight: 600;">Novo Contato Recebido</h1>';
        $htmlBody .= '<p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">De ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</p>';
        $htmlBody .= '</div>';
        
        // Content
        $htmlBody .= '<div style="padding: 30px 20px;">';
        
        // Informações
        $htmlBody .= '<div style="margin-bottom: 25px;">';
        $htmlBody .= '<h2 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #0052cc; text-transform: uppercase; letter-spacing: 1px;">Informações de Contato</h2>';
        
        $htmlBody .= '<div style="padding: 12px; background-color: #f9f9fb; border-left: 4px solid #0052cc; margin-bottom: 10px;">';
        $htmlBody .= '<p style="margin: 0; font-size: 13px; color: #666;"><strong>Nome:</strong> ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</p>';
        $htmlBody .= '</div>';
        
        $htmlBody .= '<div style="padding: 12px; background-color: #f9f9fb; border-left: 4px solid #0052cc; margin-bottom: 10px;">';
        $htmlBody .= '<p style="margin: 0; font-size: 13px; color: #666;"><strong>Email:</strong> <a href="mailto:' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '" style="color: #0052cc; text-decoration: none;">' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8') . '</a></p>';
        $htmlBody .= '</div>';
        
        $htmlBody .= '<div style="padding: 12px; background-color: #f9f9fb; border-left: 4px solid #0052cc; margin-bottom: 10px;">';
        $htmlBody .= '<p style="margin: 0; font-size: 13px; color: #666;"><strong>Telefone:</strong> ' . (htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') ?: '<em style="color: #999;">Não informado</em>') . '</p>';
        $htmlBody .= '</div>';
        
        $htmlBody .= '<div style="padding: 12px; background-color: #f9f9fb; border-left: 4px solid #0052cc;">';
        $htmlBody .= '<p style="margin: 0; font-size: 13px; color: #666;"><strong>Serviço Solicitado:</strong> ' . $serviceDisplay . '</p>';
        $htmlBody .= '</div>';
        
        $htmlBody .= '</div>';
        
        // Mensagem
        $htmlBody .= '<div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e5e5e5;">';
        $htmlBody .= '<h2 style="margin: 0 0 15px 0; font-size: 14px; font-weight: 600; color: #0052cc; text-transform: uppercase; letter-spacing: 1px;">Mensagem</h2>';
        $htmlBody .= '<div style="background-color: #f9f9fb; padding: 15px; border-radius: 6px; line-height: 1.8;">';
        $htmlBody .= '<p style="margin: 0; font-size: 14px; color: #333; white-space: pre-wrap; word-wrap: break-word;">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</p>';
        $htmlBody .= '</div>';
        $htmlBody .= '</div>';
        
        $htmlBody .= '</div>';
        
        // Footer
        $htmlBody .= '<div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #e5e5e5;">';
        $htmlBody .= '<p style="margin: 0; font-size: 12px; color: #999;">';
        $htmlBody .= 'Email automático do formulário de contato<br>';
        $htmlBody .= 'Sants Company - ' . date('d/m/Y H:i:s');
        $htmlBody .= '</p>';
        $htmlBody .= '</div>';
        
        $htmlBody .= '</div>';
        $htmlBody .= '</body>';
        $htmlBody .= '</html>';
        
        $mail->Body = $htmlBody;
        
        // ✅ PLAIN TEXT ALTERNATIVO - Zoho requer isso
        $plainBody = "NOVO CONTATO RECEBIDO\n";
        $plainBody .= str_repeat("=", 50) . "\n\n";
        $plainBody .= "Nome: " . $name . "\n";
        $plainBody .= "Email: " . $email . "\n";
        $plainBody .= "Telefone: " . ($phone ?: '(não informado)') . "\n";
        $plainBody .= "Serviço: " . $serviceDisplay . "\n\n";
        $plainBody .= str_repeat("-", 50) . "\n";
        $plainBody .= "MENSAGEM:\n\n";
        $plainBody .= $message . "\n\n";
        $plainBody .= str_repeat("-", 50) . "\n";
        $plainBody .= "Data/Hora: " . date('d/m/Y H:i:s') . "\n";
        
        $mail->AltBody = $plainBody;
        
        error_log("📧 Tentando enviar email...");
        error_log("  Host: " . SMTP_HOST . ":" . SMTP_PORT);
        error_log("  De: " . $email . " (" . $name . ")");
        error_log("  Para: " . TO_EMAIL);
        error_log("  Assunto: " . $mail->Subject);
        
        try {
            $sent = $mail->send();
            error_log("✅ Email enviado com sucesso!");
        } catch (Exception $e) {
            error_log("❌ Erro ao enviar: " . $e->getMessage());
            throw new RuntimeException('Erro ao enviar email: ' . $e->getMessage());
        }
    } else {
        throw new RuntimeException('O envio de e-mail não está configurado corretamente.');
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