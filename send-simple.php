<?php
// FORMULÁRIO SIMPLES - SEM SENHA
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método inválido']);
    exit;
}

// Verificar hCaptcha
$captcha = $_POST['h-captcha-response'] ?? '';
if (empty($captcha)) {
    echo json_encode(['success' => false, 'message' => 'Complete a verificação anti-robô']);
    exit;
}

// Obter dados
$name = trim($_POST['name'] ?? '');
$email = trim($_POST['email'] ?? '');  
$phone = trim($_POST['phone'] ?? '');
$message = trim($_POST['message'] ?? '');

// Validações básicas
if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Preencha todos os campos obrigatórios']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Email inválido']);
    exit;
}

// Envio simples com mail() do PHP
$to = 'contato@santscompany.com';
$subject = 'Novo contato: ' . $name;
$headers = "From: $email\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$body = "NOVO CONTATO - SANTS COMPANY\n\n";
$body .= "Nome: $name\n";
$body .= "Email: $email\n"; 
$body .= "Telefone: " . (!empty($phone) ? $phone : 'Não informado') . "\n\n";
$body .= "Mensagem:\n$message\n\n";
$body .= "Data: " . date('d/m/Y H:i:s');

// Tentar enviar
if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true, 'message' => '✅ Mensagem enviada!']);
} else {
    echo json_encode(['success' => false, 'message' => '❌ Erro ao enviar']);
}
?>