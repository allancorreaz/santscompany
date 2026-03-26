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

## Tecnologias Utilizadas
- HTML5, CSS3, JavaScript puro
- PHP 7+
- PHPMailer
- Google reCAPTCHA v2
- Apache (.htaccess)

## Observações
- Este repositório é privado.
- Para dúvidas técnicas, consulte o README-EMAIL.md (oculto) ou contate os administradores da Sants Company.
