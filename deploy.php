<?php
// ==============================================
// WEBHOOK DE DEPLOY AUTOMÁTICO - GITHUB → HOSTINGER
// ==============================================
// URL: https://santscompany.com/deploy.php
// ==============================================

// Chave secreta para validar requisições (MUDE ESTA CHAVE!)
$secret = 'sants2026_deploy_secret_key';

// Log de deploys
$logFile = __DIR__ . '/deploy.log';

// Verificar se é POST do GitHub
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die('Método não permitido');
}

// Verificar assinatura do GitHub
$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$payload = file_get_contents('php://input');

if (!empty($secret)) {
    $expected = 'sha256=' . hash_hmac('sha256', $payload, $secret);
    if (!hash_equals($expected, $signature)) {
        http_response_code(403);
        file_put_contents($logFile, date('Y-m-d H:i:s') . " - ERRO: Assinatura inválida\n", FILE_APPEND);
        die('Assinatura inválida');
    }
}

// Verificar se é push na branch master
$data = json_decode($payload, true);
$branch = $data['ref'] ?? '';

if ($branch !== 'refs/heads/master') {
    http_response_code(200);
    die('Ignorando: não é a branch master');
}

// Executar git pull
$output = [];
$returnCode = 0;

// Mudar para o diretório do site
chdir(__DIR__);

// Executar comandos
exec('git fetch origin 2>&1', $output, $returnCode);
exec('git reset --hard origin/master 2>&1', $output, $returnCode);

// Log do resultado
$logMessage = date('Y-m-d H:i:s') . " - Deploy executado\n";
$logMessage .= "Branch: master\n";
$logMessage .= "Commit: " . ($data['head_commit']['message'] ?? 'N/A') . "\n";
$logMessage .= "Autor: " . ($data['head_commit']['author']['name'] ?? 'N/A') . "\n";
$logMessage .= "Output: " . implode("\n", $output) . "\n";
$logMessage .= "Return Code: $returnCode\n";
$logMessage .= "---\n";

file_put_contents($logFile, $logMessage, FILE_APPEND);

// Resposta
if ($returnCode === 0) {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Deploy realizado com sucesso!']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no deploy', 'output' => $output]);
}
?>
