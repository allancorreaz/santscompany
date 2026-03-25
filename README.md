# Sants Company

Site institucional com blog, formulários de contato em PHP e componentes globais.

## Estrutura

```text
.
|-- index.html
|-- pages/
|-- blog/
|-- components/
|-- assets/
|   |-- css/
|   |-- js/
|   `-- images/
|-- data/
|   `-- blog/
|-- server/
|   |-- contact.php
|   |-- mail-config.php
|   |-- credentials-local.example.php
|   |-- deploy-config.example.php
|   `-- tools/
|-- scripts/
|   `-- setup-security.php
|-- composer.json
|-- .htaccess
|-- send.php
|-- config.php
`-- deploy.php
```

## Segurança

- Não suba `server/credentials-local.php`.
- Não suba `server/deploy-config.local.php`.
- O segredo do webhook de deploy não fica mais hardcoded no repositório.
- O `deploy.php` da raiz é apenas um wrapper para o handler real em `server/tools/`.
- O `setup-security.php` da raiz responde com `403`; o configurador real fica em `scripts/setup-security.php`.

## Configuração local

1. Copie:
   - `server/credentials-local.example.php` para `server/credentials-local.php`
   - `server/deploy-config.example.php` para `server/deploy-config.local.php`
2. Preencha os valores reais apenas nos arquivos locais.
3. Instale dependências com `composer install` se quiser usar PHPMailer.

## Observação importante

O `site key` do reCAPTCHA aparece no frontend por natureza e isso é esperado. O que precisa permanecer privado é o `RECAPTCHA_SECRET`, que agora deve ficar somente em `server/credentials-local.php`.
