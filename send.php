<?php
// ===================================
// ENVIO DE EMAIL - SANTS COMPANY
// ===================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método inválido']);
    exit;
}

try {
    // Carregar configurações
    require_once 'config.php';
    
    // Verificar reCAPTCHA
    $captcha = $_POST['g-recaptcha-response'] ?? '';
    if (empty($captcha)) {
        echo json_encode(['success' => false, 'message' => 'Complete a verificação anti-robô']);
        exit;
    }
    
    // Validar captcha no servidor Google reCAPTCHA
    $secretKey = defined('RECAPTCHA_SECRET') ? RECAPTCHA_SECRET : '';
    $verifyURL = 'https://www.google.com/recaptcha/api/siteverify';
    $response = file_get_contents($verifyURL . '?secret=' . $secretKey . '&response=' . $captcha);
    $responseData = json_decode($response);
    
    if (!$responseData->success) {
        echo json_encode(['success' => false, 'message' => 'Verificação anti-robô falhou']);
        exit;
    }
    
    // Obter dados
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $phone = trim($_POST['phone'] ?? '');
    $message = trim($_POST['message'] ?? '');
    
    // Validações
    if (empty($name) || empty($email) || empty($message)) {
        echo json_encode(['success' => false, 'message' => 'Preencha todos os campos obrigatórios']);
        exit;
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Email inválido']);
        exit;
    }
    
    // Configurar PHPMailer (ANTI-SPAM)
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = SMTP_HOST;
    $mail->SMTPAuth = true;
    $mail->Username = SMTP_USERNAME;
    $mail->Password = SMTP_PASSWORD;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = SMTP_PORT;
    $mail->CharSet = 'UTF-8';
    
    // Headers ANTI-SPAM (importantes!)
    $mail->setFrom(FROM_EMAIL, 'Sants Company');
    $mail->addAddress(TO_EMAIL, 'Sants Company');
    $mail->addReplyTo($email, $name);
    
    // Headers adicionais para evitar SPAM
    $mail->addCustomHeader('X-Mailer', 'Sants Company Contact Form');
    $mail->addCustomHeader('X-Priority', '3');
    $mail->addCustomHeader('List-Unsubscribe', '<mailto:contato@santscompany.com>');
    $mail->addCustomHeader('Precedence', 'bulk');
    
    // Conteúdo otimizado (ANTI-SPAM)
    $mail->isHTML(true);
    $mail->Subject = 'Novo contato: ' . $name . ' - ' . date('d/m/Y');
    
    $mail->Body = '
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 24px;">✨ Novo Contato</h1>
                <p style="margin: 10px 0 0; opacity: 0.9;">Formulário do site Sants Company</p>
            </div>
            
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e1e5e9; border-top: none;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #dee2e6;">👤 Nome:</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">' . htmlspecialchars($name) . '</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #dee2e6;">📧 Email:</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;"><a href="mailto:' . htmlspecialchars($email) . '" style="color: #2563eb; text-decoration: none;">' . htmlspecialchars($email) . '</a></td>
                    </tr>
                    <tr style="background: #f8f9fa;">
                        <td style="padding: 12px; font-weight: bold; border: 1px solid #dee2e6;">📱 Telefone:</td>
                        <td style="padding: 12px; border: 1px solid #dee2e6;">' . (!empty($phone) ? htmlspecialchars($phone) : 'Não informado') . '</td>
                    </tr>
                </table>
                
                <div style="margin: 25px 0;">
                    <h3 style="color: #1e3a5f; margin-bottom: 15px;">💬 Mensagem:</h3>
                    <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #2563eb; border-radius: 4px;">
                        ' . nl2br(htmlspecialchars($message)) . '
                    </div>
                </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; color: #666;">
                <p style="margin: 0;">📅 Enviado em: ' . date('d/m/Y H:i:s') . ' | 🌐 IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'N/A') . '</p>
                <p style="margin: 5px 0 0;">🔒 Formulário protegido por hCaptcha | ✅ Verificação anti-robô aprovada</p>
            </div>
        </div>
    </body>
    </html>';
    
    // Versão texto
    $mail->AltBody = "NOVO CONTATO - SANTS COMPANY\n\n" .
                     "Nome: $name\n" .
                     "Email: $email\n" .
                     "Telefone: " . (!empty($phone) ? $phone : 'Não informado') . "\n\n" .
                     "Mensagem:\n$message\n\n" .
                     "Data: " . date('d/m/Y H:i:s');
    
    // Enviar
    $mail->send();
    
    echo json_encode([
        'success' => true, 
        'message' => '✅ Mensagem enviada com sucesso! Responderemos em breve.'
    ]);
    
} catch (Exception $e) {
    error_log('Erro no envio: ' . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => '❌ Erro ao enviar. Tente novamente em alguns minutos.'
    ]);
}
?>