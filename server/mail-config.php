<?php

if (basename(__FILE__) === basename($_SERVER['SCRIPT_NAME'] ?? '')) {
    http_response_code(403);
    exit('Acesso negado');
}

$credentialsPath = __DIR__ . '/credentials-local.php';
if (file_exists($credentialsPath)) {
    require_once $credentialsPath;
}

defined('RECAPTCHA_SITE_KEY') || define('RECAPTCHA_SITE_KEY', '');
defined('FROM_EMAIL') || define('FROM_EMAIL', 'contato@santscompany.com');
defined('TO_EMAIL') || define('TO_EMAIL', 'contato@santscompany.com');
defined('RECAPTCHA_SECRET') || define('RECAPTCHA_SECRET', '');
defined('RESEND_API_KEY') || define('RESEND_API_KEY', '');