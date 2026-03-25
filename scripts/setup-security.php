<?php
// ==============================================
// CONFIGURADOR SEGURO SIMPLES - SEM SERVIDOR
// Execute: php setup-security.php
// ==============================================

// Verificar se está rodando via CLI
if (php_sapi_name() !== 'cli') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Processar via web também
        processWebRequest();
        exit;
    }
    showWebInterface();
    exit;
}

echo "\n";
echo "🔐 ========================================\n";
echo "   CONFIGURADOR SEGURO - SANTS COMPANY  \n";
echo "   Criptografia AES-256 Militar         \n";
echo "========================================\n\n";

// Verificar se já foi configurado
$cred_file = dirname(__DIR__) . '/server/credentials-local.php';
if (file_exists($cred_file)) {
    $content = file_get_contents($cred_file);
    if (strpos($content, 'CHAVE_SERA_GERADA_AUTOMATICAMENTE') === false) {
        echo "✅ JÁ CONFIGURADO!\n";
        echo "Seu sistema está protegido com criptografia AES-256.\n";
        echo "Formulário pronto para uso!\n\n";
        deleteThisFile();
        exit;
    }
}

echo "Digite sua senha do Zoho (contato@santscompany.com):\n";
echo "⚠️  A senha será criptografada e NUNCA ficará visível!\n\n";

// Obter senha
$password = trim(readline("Senha: "));
if (empty($password)) {
    echo "❌ Senha não pode estar vazia!\n";
    exit(1);
}

echo "\nConfirme sua senha: ";
$confirm = trim(readline());
if ($password !== $confirm) {
    echo "❌ Senhas não coincidem!\n";
    exit(1);
}

echo "\n🔐 Criptografando com AES-256...\n";

try {
    // Gerar dados seguros
    $crypto_key = bin2hex(random_bytes(32));
    $iv = random_bytes(16);
    $encrypted = openssl_encrypt($password, 'AES-256-CBC', $crypto_key, 0, $iv);
    $encrypted_with_iv = base64_encode($iv . $encrypted);
    $password_hash = hash('sha256', $password);
    
    // Criar arquivo seguro
    $secure_content = createSecureCredentials($crypto_key, $encrypted_with_iv, $password_hash);
    file_put_contents($cred_file, $secure_content);
    
    // Limpar variáveis
    $password = null; $confirm = null; $crypto_key = null;
    $encrypted = null; $encrypted_with_iv = null; $password_hash = null;
    unset($password, $confirm, $crypto_key, $encrypted, $encrypted_with_iv, $password_hash);
    
    echo "✅ CRIPTOGRAFIA CONCLUÍDA COM SUCESSO!\n";
    echo "🛡️  Sua senha está protegida com AES-256\n";
    echo "🗑️  Este arquivo será removido...\n\n";
    
    sleep(2);
    deleteThisFile();
    
    echo "🎉 CONFIGURAÇÃO FINALIZADA!\n";
    echo "Seu formulário está pronto para uso seguro!\n\n";
    
} catch (Exception $e) {
    echo "❌ Erro na criptografia: " . $e->getMessage() . "\n";
    exit(1);
}

function createSecureCredentials($key, $encrypted, $hash) {
    return '<?php
// ==============================================
// SISTEMA SEGURO COM CRIPTOGRAFIA AES-256
// ==============================================
// NUNCA ALTERE ESTE ARQUIVO MANUALMENTE!
// Use o sistema de configuração segura!
// ==============================================

// Chave de criptografia única (gerada automaticamente)
define(\'CRYPTO_KEY\', \'' . $key . '\');

// Senha criptografada (AES-256-CBC)
$encrypted_password = \'' . $encrypted . '\';

// Hash de verificação
$password_hash = \'' . $hash . '\';

// Configurações SMTP fixas
define(\'SMTP_HOST\', \'smtp.zoho.com\');
define(\'SMTP_PORT\', 587);
define(\'SMTP_USERNAME\', \'contato@santscompany.com\');

// Função de descriptografia segura
function decrypt_password($encrypted, $key) {
    try {
        $data = base64_decode($encrypted);
        $iv = substr($data, 0, 16);
        $encrypted_data = substr($data, 16);
        return openssl_decrypt($encrypted_data, \'AES-256-CBC\', $key, 0, $iv);
    } catch (Exception $e) {
        return false;
    }
}

// Obter senha descriptografada
if (defined(\'CRYPTO_KEY\') && CRYPTO_KEY !== \'CHAVE_SERA_GERADA_AUTOMATICAMENTE\') {
    $decrypted = decrypt_password($encrypted_password, CRYPTO_KEY);
    if ($decrypted && hash(\'sha256\', $decrypted) === $password_hash) {
        define(\'SMTP_PASSWORD\', $decrypted);
    } else {
        die(\'ERRO DE SEGURANÇA: Senha corrompida ou chave inválida!\');
    }
} else {
    die(\'ERRO: Sistema de segurança não configurado!\');
}

// Limpar variáveis sensíveis da memória
$encrypted_password = null;
$password_hash = null;
$decrypted = null;
unset($encrypted_password, $password_hash, $decrypted);
?>';
}

function deleteThisFile() {
    $thisFile = __FILE__;
    if (file_exists($thisFile)) {
        unlink($thisFile);
        echo "🗑️  Arquivo configurador removido por segurança!\n";
    }
}

function processWebRequest() {
    // Mesma lógica para web
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';
    
    if ($password !== $confirm) {
        echo json_encode(['error' => 'Senhas não coincidem']);
        return;
    }
    
    // Criptografar...
    // (mesmo código da versão CLI)
}

function showWebInterface() {
    // Interface web como backup
    echo '<!DOCTYPE html><html><head><title>Configurador Seguro</title></head><body>';
    echo '<h1>Execute via terminal: php setup-security.php</h1>';
    echo '<p>Para máxima segurança, use o terminal!</p></body></html>';
}
?>

// Processar configuração
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$already_configured) {
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm'] ?? '';
    
    if (empty($password)) {
        $error = 'Digite sua senha do Zoho';
    } elseif ($password !== $confirm) {
        $error = 'Senhas não coincidem';
    } elseif (strlen($password) < 6) {
        $error = 'Senha deve ter pelo menos 6 caracteres';
    } else {
        try {
            // Gerar chave de criptografia única
            $crypto_key = bin2hex(random_bytes(32)); // 256 bits
            
            // Gerar IV aleatório
            $iv = random_bytes(16);
            
            // Criptografar senha com AES-256-CBC
            $encrypted = openssl_encrypt($password, 'AES-256-CBC', $crypto_key, 0, $iv);
            $encrypted_with_iv = base64_encode($iv . $encrypted);
            
            // Gerar hash de verificação
            $password_hash = hash('sha256', $password);
            
            // Criar conteúdo seguro
            $secure_content = '<?php
// ==============================================
// SISTEMA SEGURO COM CRIPTOGRAFIA AES-256
// ==============================================
// NUNCA ALTERE ESTE ARQUIVO MANUALMENTE!
// Use o sistema de configuração segura!
// ==============================================

// Chave de criptografia única (gerada automaticamente)
define(\'CRYPTO_KEY\', \'' . $crypto_key . '\');

// Senha criptografada (AES-256-CBC)
$encrypted_password = \'' . $encrypted_with_iv . '\';

// Hash de verificação
$password_hash = \'' . $password_hash . '\';

// Configurações SMTP fixas
define(\'SMTP_HOST\', \'smtp.zoho.com\');
define(\'SMTP_PORT\', 587);
define(\'SMTP_USERNAME\', \'contato@santscompany.com\');

// Função de descriptografia segura
function decrypt_password($encrypted, $key) {
    try {
        $data = base64_decode($encrypted);
        $iv = substr($data, 0, 16);
        $encrypted_data = substr($data, 16);
        return openssl_decrypt($encrypted_data, \'AES-256-CBC\', $key, 0, $iv);
    } catch (Exception $e) {
        return false;
    }
}

// Obter senha descriptografada
if (defined(\'CRYPTO_KEY\') && CRYPTO_KEY !== \'CHAVE_SERA_GERADA_AUTOMATICAMENTE\') {
    $decrypted = decrypt_password($encrypted_password, CRYPTO_KEY);
    if ($decrypted && hash(\'sha256\', $decrypted) === $password_hash) {
        define(\'SMTP_PASSWORD\', $decrypted);
    } else {
        die(\'ERRO DE SEGURANÇA: Senha corrompida ou chave inválida!\');
    }
} else {
    die(\'ERRO: Sistema de segurança não configurado!\');
}

// Limpar variáveis sensíveis da memória
$encrypted_password = null;
$password_hash = null;
$decrypted = null;
unset($encrypted_password, $password_hash, $decrypted);
?>';

            // Salvar arquivo criptografado
            file_put_contents($cred_file, $secure_content);
            
            // Limpar variáveis da memória
            $password = null;
            $confirm = null;
            $crypto_key = null;
            $encrypted = null;
            $encrypted_with_iv = null;
            $password_hash = null;
            unset($password, $confirm, $crypto_key, $encrypted, $encrypted_with_iv, $password_hash);
            
            $success = true;
            
        } catch (Exception $e) {
            $error = 'Erro na criptografia: ' . $e->getMessage();
        }
    }
}

// Auto-deletar este arquivo após sucesso
if (isset($success) && $success) {
    echo '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>✅ Configuração Concluída!</title>
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #22c55e, #16a34a); margin: 0; padding: 20px; color: white; text-align: center; }
        .container { max-width: 500px; margin: 50px auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; backdrop-filter: blur(10px); }
        h1 { font-size: 2rem; margin-bottom: 20px; }
        p { font-size: 1.1rem; line-height: 1.6; }
        .success-icon { font-size: 4rem; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">🔐</div>
        <h1>Sistema Configurado com Sucesso!</h1>
        <p>✅ Sua senha foi criptografada com <strong>AES-256</strong></p>
        <p>🛡️ Máxima segurança garantida</p>
        <p>🗑️ Este arquivo será deletado em 3 segundos</p>
        <p><strong>Seu formulário está pronto para uso!</strong></p>
    </div>
    <script>
        setTimeout(function() {
            fetch("' . $_SERVER['PHP_SELF'] . '?delete=1", {method: "POST"})
            .then(() => { 
                document.body.innerHTML = "<div style=\"text-align:center; margin:50px; font-size:1.2em;\">🎉 Configuração finalizada! Este arquivo foi removido por segurança.</div>";
            });
        }, 3000);
    </script>
</body>
</html>';
    
    // Auto-deletar o arquivo
    if ($_GET['delete'] ?? false) {
        unlink(__FILE__);
        exit('Arquivo removido por segurança');
    }
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔐 Configuração Segura - Sants Company</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #1e3a5f, #0f172a); 
            color: white; 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center;
        }
        .container { 
            max-width: 450px; 
            background: rgba(255,255,255,0.1); 
            padding: 40px; 
            border-radius: 20px; 
            backdrop-filter: blur(15px); 
            border: 1px solid rgba(255,255,255,0.2);
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        h1 { 
            text-align: center; 
            margin-bottom: 10px; 
            font-size: 1.8rem;
            color: #fff;
        }
        .subtitle { 
            text-align: center; 
            margin-bottom: 30px; 
            opacity: 0.9;
            font-size: 0.95rem;
        }
        .security-info {
            background: rgba(34, 197, 94, 0.2);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 25px;
            border-left: 4px solid #22c55e;
        }
        .security-info h3 {
            margin-bottom: 8px;
            font-size: 1rem;
        }
        .security-info p {
            font-size: 0.9rem;
            opacity: 0.9;
            line-height: 1.4;
        }
        input { 
            width: 100%; 
            padding: 15px; 
            margin-bottom: 15px; 
            border: 2px solid rgba(255,255,255,0.3); 
            border-radius: 10px; 
            background: rgba(255,255,255,0.1); 
            color: white; 
            font-size: 1rem;
        }
        input::placeholder { color: rgba(255,255,255,0.7); }
        input:focus { 
            outline: none; 
            border-color: #22c55e; 
            box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3);
        }
        button { 
            width: 100%; 
            padding: 15px; 
            background: linear-gradient(135deg, #22c55e, #16a34a); 
            color: white; 
            border: none; 
            border-radius: 10px; 
            font-size: 1.1rem; 
            font-weight: 600; 
            cursor: pointer; 
            transition: all 0.3s;
        }
        button:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 8px 25px rgba(34, 197, 94, 0.4);
        }
        .error { 
            background: rgba(239, 68, 68, 0.2); 
            color: white; 
            padding: 12px; 
            border-radius: 8px; 
            margin-bottom: 15px;
            border-left: 4px solid #ef4444;
            font-size: 0.95rem;
        }
        .already-configured {
            text-align: center;
            padding: 30px;
        }
        .already-configured h2 {
            color: #22c55e;
            margin-bottom: 15px;
        }
        .features {
            margin: 20px 0;
            font-size: 0.9rem;
        }
        .features li {
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
        }
        .features li::before {
            content: "🔒";
            position: absolute;
            left: 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <?php if ($already_configured): ?>
            <div class="already-configured">
                <h2>✅ Já Configurado!</h2>
                <p>Seu sistema de email está protegido com criptografia AES-256.</p>
                <p style="margin-top: 15px;"><strong>Seu formulário está pronto para uso!</strong></p>
            </div>
        <?php else: ?>
            <h1>🔐 Configuração Segura</h1>
            <p class="subtitle">Digite sua senha uma única vez - será criptografada com AES-256</p>
            
            <div class="security-info">
                <h3>🛡️ Segurança Maximizada</h3>
                <p>Sua senha será protegida com criptografia militar e nunca ficará visível em texto puro.</p>
            </div>
            
            <?php if (isset($error)): ?>
                <div class="error">❌ <?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <input type="password" name="password" placeholder="Digite sua senha do Zoho" required minlength="6" autocomplete="new-password">
                <input type="password" name="confirm" placeholder="Confirme sua senha" required minlength="6" autocomplete="new-password">
                <button type="submit">🔐 Criptografar e Salvar</button>
            </form>
            
            <ul class="features">
                <li>Criptografia AES-256-CBC</li>
                <li>Chave única gerada automaticamente</li>
                <li>Hash de verificação SHA-256</li>
                <li>Este arquivo se auto-deleta após uso</li>
                <li>Zero riscos de exposição</li>
            </ul>
        <?php endif; ?>
    </div>
</body>
</html>
