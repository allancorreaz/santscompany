# Sants Company Website

Este repositório contém o código-fonte do site institucional da Sants Company, agência de marketing e programação. O projeto é privado e serve para backup, versionamento e futura colaboração.

## Visão Técnica do Projeto

- **Frontend:**
  - HTML5 sem frameworks pesados, focado em performance e SEO.
  - CSS3 modularizado em `assets/css/main.css`.
  - JavaScript puro para interações, componentes e blog (`assets/js/`).
  - Componentização via includes HTML (`components/`).
  - Estrutura responsiva e acessível.

- **Backend:**
  - PHP puro para processamento do formulário de contato (`server/contact.php`).
  - Envio de e-mails via PHPMailer (SMTP seguro, fallback para mail nativo).
  - Validação de dados, honeypot e integração com Google reCAPTCHA v2.
  - Configurações sensíveis isoladas em arquivos ignorados pelo Git.

- **Segurança:**
  - `.gitignore` impede versionamento de credenciais, configs locais, logs e backups.
  - `.htaccess` bloqueia acesso externo a arquivos críticos (configs, scripts, composer.json, etc.).
  - Formulário protegido contra spam e ataques automatizados.

- **Estrutura Modular:**
  - `assets/` — CSS, JS e imagens organizados.
  - `blog/` — Estrutura para posts, imagens e backups.
  - `components/` — Header, footer e outros HTMLs reutilizáveis.
  - `data/` — Dados do blog em JSON.
  - `pages/` — Páginas institucionais separadas.
  - `server/` — Backend, configs e scripts de deploy.
  - `vendor/` — Dependências PHP (PHPMailer).

- **Deploy e Manutenção:**
  - Arquivos sensíveis devem ser criados a partir dos exemplos e preenchidos localmente.
  - Dependências PHP gerenciadas via Composer.
  - Atualizações refletidas automaticamente no site após deploy.

## Como funciona o formulário de contato?
1. Usuário preenche o formulário em `/contato.html` ou na home.
2. Dados são enviados via POST para `server/contact.php`.
3. Backend valida campos, honeypot e reCAPTCHA.
4. E-mail é enviado via SMTP (PHPMailer) ou mail() nativo.
5. Resposta JSON para AJAX, exibindo feedback ao usuário.

## Estrutura Completa do Projeto

```text
Sants Company/
├── .gitignore
├── .htaccess
├── .htaccess.example
├── composer.json
├── composer.lock
├── config.php
├── deploy.php
├── index.html
├── README-EMAIL.md
├── README.md
├── send.php
├── setup-security.php
├── teste.php
├── assets/
│   ├── css/
│   │   ├── form-custom-select.css
│   │   └── main.css
│   ├── images/
│   │   ├── branding/
│   │   │   ├── Image.jpeg
│   │   │   ├── Image.png
│   │   │   ├── logo.png
│   │   │   ├── logo.svg
│   │   │   └── logo1.png
│   │   └── library/
│   │       ├── logo.png
│   │       └── WhatsApp Image 2026-02-26 at 13.58.22.jpeg
│   └── js/
│       ├── blog-list.js
│       ├── blog-post.js
│       ├── components.js
│       ├── forms.js
│       └── main.js
├── blog/
│   ├── index.html
│   ├── post.html
│   ├── __backup__/
│   └── img/
├── components/
│   ├── contact-form.html
│   ├── footer.html
│   ├── header.html
│   ├── numeros-q-falam.html
│   ├── portfolio.html
│   └── reviews-google.html
├── data/
│   └── blog/
│       └── posts.json
├── pages/
│   ├── contato.html
│   ├── servicos.html
│   └── sobre.html
├── scripts/
│   └── setup-security.php
├── server/
│   ├── contact.php
│   ├── credentials-local.example.php
│   ├── credentials-local.php
│   ├── deploy-config.example.php
│   ├── mail-config.php
│   ├── storage/
│   │   └── contact-submissions.jsonl
│   └── tools/
│       └── deploy-webhook.php
└── vendor/
```

## Tecnologias Utilizadas
- HTML5, CSS3, JavaScript puro
- PHP 7+
- PHPMailer
- Google reCAPTCHA v2
- Apache (.htaccess)

## Observações
- Este repositório é privado.
- Para dúvidas técnicas, consulte o README-EMAIL.md (oculto) ou contate os administradores da Sants Company.
