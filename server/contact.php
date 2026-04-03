<?php
declare(strict_types=1);

date_default_timezone_set('America/Sao_Paulo');

error_reporting(E_ALL);
ini_set('display_errors', '1');

set_exception_handler(function ($e) {
    while (ob_get_level() > 0) ob_end_clean();
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'success' => false,
        'message' => 'Erro interno no servidor.',
    ]);
    exit;
});

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new ErrorException($message, 0, $severity, $file, $line);
});

ob_start();

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false]);
    exit;
}

require_once __DIR__ . '/mail-config.php';

/* ========================= HELPERS ========================= */

function json_response($success, $message) {
    while (ob_get_level() > 0) ob_end_clean();
    echo json_encode(['success' => $success, 'message' => $message]);
    exit;
}

/* ========================= RECAPTCHA V3 ========================= */

function verify_recaptcha($token) {
    if (!$token) return false;

    $response = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret=" . RECAPTCHA_SECRET . "&response=" . $token);
    $result = json_decode($response, true);

    return $result['success'] && $result['score'] >= 0.5;
}

/* ========================= DADOS ========================= */

$honeypot = $_POST['company'] ?? '';
if (!empty($honeypot)) json_response(false, 'Spam detectado');

$captcha = $_POST['g-recaptcha-response'] ?? '';
if (!verify_recaptcha($captcha)) {
    json_response(false, 'Falha no reCAPTCHA');
}

$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');
$phone = trim($_POST['phone'] ?? '');
$serviceType = trim($_POST['serviceType'] ?? '');
$otherService = trim($_POST['otherService'] ?? '');
$message = trim($_POST['message'] ?? '');

if (!$name || !$email || !$message) {
    json_response(false, 'Campos obrigatórios faltando');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_response(false, 'Email inválido');
}

/* ========================= SALVAR LEAD (NOVO) ========================= */

$leadData = [
    'date' => date('Y-m-d H:i:s'),
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'service' => $serviceType,
    'otherService' => $otherService,
    'message' => $message,
    'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
];

$storagePath = __DIR__ . '/storage/contact-submissions.jsonl';

file_put_contents(
    $storagePath,
    json_encode($leadData, JSON_UNESCAPED_UNICODE) . PHP_EOL,
    FILE_APPEND | LOCK_EX
);

/* ========================= EMAIL ========================= */

require_once dirname(__DIR__) . '/vendor/autoload.php';

$mail = new PHPMailer\PHPMailer\PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = 'tls';
    $mail->Port = SMTP_PORT;

    $mail->setFrom('noreply@santscompany.com', 'Sants Company');
    $mail->addAddress(TO_EMAIL);

    $mail->addReplyTo($email, $name);

    $mail->isHTML(true);
    $mail->Subject = "Novo lead - $name";

    $mail->Body = "
    <div style='font-family:Arial;padding:20px;background:#f4f4f4'>
      <div style='max-width:600px;margin:auto;background:#fff;padding:20px;border-radius:8px'>
        <h2 style='color:#2563eb'>Novo Lead Recebido 🚀</h2>
        <p><strong>Nome:</strong> $name</p>
        <p><strong>Email:</strong> $email</p>
        <p><strong>Telefone:</strong> $phone</p>
        <p><strong>Serviço:</strong> $serviceType $otherService</p>
        <hr>
        <p>$message</p>
        <small>Data: " . date('d/m/Y H:i') . "</small>
      </div>
    </div>
    ";

    $mail->AltBody = "Novo lead: $name - $email";

    $mail->send();

} catch (Exception $e) {
    json_response(false, 'Erro ao enviar email');
}

json_response(true, 'Mensagem enviada com sucesso!');