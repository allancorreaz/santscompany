<?php
header('Content-Type: application/json; charset=utf-8');

$configPath = dirname(__DIR__) . '/deploy-config.local.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Configuração local do deploy ausente.']);
    exit;
}

require_once $configPath;

if (!defined('DEPLOY_WEBHOOK_SECRET') || DEPLOY_WEBHOOK_SECRET === '') {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Segredo do deploy não configurado.']);
    exit;
}

$logFile = dirname(__DIR__, 2) . '/deploy.log';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

$signature = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$payload = file_get_contents('php://input');
$expected = 'sha256=' . hash_hmac('sha256', $payload, DEPLOY_WEBHOOK_SECRET);

if (!hash_equals($expected, $signature)) {
    http_response_code(403);
    file_put_contents($logFile, date('Y-m-d H:i:s') . " - ERRO: Assinatura inválida\n", FILE_APPEND);
    echo json_encode(['success' => false, 'message' => 'Assinatura inválida.']);
    exit;
}

$data = json_decode($payload, true);
$branch = $data['ref'] ?? '';

if ($branch !== 'refs/heads/master') {
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Ignorado: não é a branch master.']);
    exit;
}

$output = [];
$returnCode = 0;
chdir(dirname(__DIR__, 2));
exec('git fetch origin 2>&1', $output, $returnCode);
exec('git reset --hard origin/master 2>&1', $output, $returnCode);

$logMessage = date('Y-m-d H:i:s') . " - Deploy executado\n";
$logMessage .= "Branch: master\n";
$logMessage .= "Commit: " . ($data['head_commit']['message'] ?? 'N/A') . "\n";
$logMessage .= "Autor: " . ($data['head_commit']['author']['name'] ?? 'N/A') . "\n";
$logMessage .= "Output: " . implode("\n", $output) . "\n";
$logMessage .= "Return Code: {$returnCode}\n---\n";
file_put_contents($logFile, $logMessage, FILE_APPEND);

if ($returnCode === 0) {
    echo json_encode(['success' => true, 'message' => 'Deploy realizado com sucesso.']);
    exit;
}

http_response_code(500);
echo json_encode(['success' => false, 'message' => 'Erro no deploy.', 'output' => $output]);
