<?php
// Verificar acesso direto
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'] ?? '')) {
    die('Acesso negado');
}

// Carregar credenciais
$credFile = __DIR__ . '/credentials-local.php';
if (file_exists($credFile)) {
    include $credFile;
} else {
    die('ERRO: Edite o arquivo credentials-local.php e coloque sua senha!');
}

// Verificar configuração
if (!defined('SMTP_PASSWORD') || SMTP_PASSWORD === 'COLOQUE_SUA_SENHA_AQUI') {
    die('ERRO: Coloque sua senha real no arquivo credentials-local.php');
}

// Configurações fixas
define('FROM_EMAIL', 'contato@santscompany.com');
define('TO_EMAIL', 'contato@santscompany.com');
?>