# 🚀 Sants Company - Landing Page

Landing page profissional da Sants Company com formulário de contato integrado via Zoho Mail.

## 📁 Estrutura do Projeto

```
├── index.html          # Página principal
├── config.php          # Configurações gerais
├── credentials-local.php  # Credenciais SMTP (criptografado)
├── send.php            # Backend do formulário
├── setup-security.php  # Configurador de senha (APAGAR após uso)
├── .htaccess           # Segurança Apache
├── composer.json       # Dependências PHP
├── css/
│   └── style.css       # Estilos
├── js/
│   └── script.js       # JavaScript
├── img/
│   └── logo.png        # Logo e imagens
└── vendor/             # Dependências (gerado pelo composer)
```

## ⚙️ Tecnologias

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** PHP 7.4+
- **Email:** PHPMailer + Zoho SMTP
- **Segurança:** hCaptcha + Criptografia AES-256

## 🔧 Configuração Inicial

### 1. Instalar Dependências PHP
```bash
composer install
```

### 2. Configurar Senha do Email
Execute o configurador:
```bash
php setup-security.php
```
Ou acesse `https://seudominio.com/setup-security.php` no navegador.

### 3. Configurar hCaptcha (Produção)
1. Crie conta em [hcaptcha.com](https://www.hcaptcha.com)
2. Adicione seu domínio
3. Substitua as chaves:
   - **Site Key** em `index.html` (linha do data-sitekey)
   - **Secret Key** em `send.php` (variável $secretKey)

## 📧 Configuração SMTP (Zoho)

As credenciais estão configuradas para:
- **Email:** contato@santscompany.com
- **Servidor:** smtp.zoho.com
- **Porta:** 587 (TLS)

## 🛡️ Segurança

- Senha SMTP criptografada com AES-256-CBC
- Arquivos sensíveis bloqueados via .htaccess
- Verificação anti-robô com hCaptcha
- Validação de dados no frontend e backend

## 🌐 Deploy (Hostinger)

1. Acesse hPanel da Hostinger
2. Vá em **Gerenciador de Arquivos** ou use FTP
3. Envie todos os arquivos para `public_html/`
4. Configure a senha via `setup-security.php`
5. Instale dependências via Terminal SSH: `composer install`
6. **DELETE** o arquivo `setup-security.php` após configurar

## 📞 Contato

- **Email:** contato@santscompany.com
- **WhatsApp:** +55 21 97907-5762
- **Site:** https://www.santscompany.com

---

© 2026 Sants Company - Todos os direitos reservados.
