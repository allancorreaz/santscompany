# Sants Company Website

Site institucional responsivo da **Sants Company**, agência de marketing e programação. 
Código otimizado para **máxima performance e segurança** em produção.

## 🚀 Status de Performance

| Métrica | Mobile | Desktop |
|---------|--------|---------|
| **PageSpeed Score** | 86/100 | 97/100 |
| **FCP** | ~1.2s | ~1.1s |
| **LCP** | ~2.1s | ~1.9s |
| **CLS** | 0.0 | 0.02 |
| **TBT** | 0ms | 0ms |

## 📋 O que é este projeto?

Uma **solução completa de site institucional** com:

✅ **Apresentação Professional** — Homepage, sobre, serviços, portfolio  
✅ **Blog Dinâmico** — Posts em JSON, renderização via JavaScript  
✅ **Formulário de Contato** — Com reCAPTCHA v3 e validação SMTP  
✅ **Otimizado para Dispositivos** — Responsivo em mobile, tablet, desktop  
✅ **Alto Desempenho** — Lazy-loading de resources não-críticos  
✅ **Seguro** — Proteção contra spam, credentials em `.gitignore`, .htaccess robusto  

## 🛠️ Stack Técnico

| Camada | Tecnologia | Detalhe |
|--------|-----------|--------|
| **Frontend** | HTML5, CSS3, JavaScript Puro | Sem frameworks (Vue, React) — performance first |
| **Backend** | PHP 7.2+ | Simples e direto para formulário + email |
| **Email** | PHPMailer + Zoho SMTP | SMTP TLS 587, encoding UTF-8 Base64 |
| **Segurança** | Google reCAPTCHA v3 | Validação backend + honeypot |
| **Servidor** | Apache | .htaccess com rewrite rules + GZIP compression |
| **Versionamento** | Git + GitHub | Repositório privado com CI/CD opcional |

## 📁 Estrutura do Projeto

```
Sants Company/
├── index.html                    (página inicial)
├── pages/                        (contato, serviços, sobre)
├── blog/                         (blog + posts renderizados via JS)
├── components/                   (header, footer, formulário, etc)
├── assets/
│   ├── css/                      (main.css ~72KB, blog.css, form select)
│   ├── js/                       (main.js, forms.js, blog-list.js, etc)
│   └── images/                   (branding, library com WebP + fallback)
├── server/
│   ├── contact.php               (backend form + SMTP)
│   ├── credentials-local.php     (.gitignore'd — configurações)
│   └── storage/                  (backup de submissões)
├── data/blog/posts.json          (estrutura de posts)
├── vendor/                       (Composer: PHPMailer)
├── README.md                     (este arquivo — apresentação)
└── README-EMAIL.md               (guia técnico de manutenção)
```

## 💬 Como funciona o formulário de contato?

1. Usuário preenche formulário em `/contato.html` ou homepage
2. JavaScript valida dados locais (nome, email, mensagem)
3. **reCAPTCHA** é carregado ao focar no formulário (lazy-loaded)
4. Dados são enviados via POST para `server/contact.php`
5. Backend valida novamente + valida reCAPTCHA com API Google
6. Email é enviado via **SMTP Zoho** (PHPMailer)
7. Resposta JSON com status (sucesso/erro) é retornada ao frontend

**Proteções contra spam:**
- reCAPTCHA v2 (validação backend obrigatória)
- Honeypot field invisível (iscabot)
- Rate limiting (máx 1 envio por IP a cada 60s)
- Validação de formato (email, telefone, etc)

## ⚡ Performance Otimizações

### Lazy-Loading de Resources Não-Críticos

| Resource | Estratégia | Ganho |
|----------|-----------|-------|
| **reCAPTCHA** | Carregado ao focar no formulário (focusin event) | -600ms bloqueio |
| **Font Awesome** | Deferred via `requestIdleCallback` após DOMContentLoaded | -150ms bloqueio |
| **Google Fonts** | `display=optional` + fallback de sistema | -50KB |
| **Blog.css** | Carregado apenas em `/blog/` (preload + async) | -8KB em homepage |

### CSS & JavaScript Modularizado

- **main.css** (~72 KB) — Estilos globais (header, hero, footer, layout)
- **blog.css** (~8 KB) — Estilos específicos do blog
- **form-custom-select.css** — Select customizado (preload strategy)
- Todos minificados e organizados por responsabilidade

### CLS (Cumulative Layout Shift) = 0

Espaço reservado `.global-header { min-height: 90px; }` evita layout shift quando componentes são injetados.

## 🔒 Segurança

✅ `.gitignore` — Credenciais, configs locais, logs nunca são versionados  
✅ `.htaccess` — Bloqueia acesso a `/server/`, `composer.json`, configs, scripts  
✅ **reCAPTCHA v2** — Google valida cada submissão  
✅ **Honeypot** — Campo invisível (iscabot) para detectar bots  
✅ **Validação Backend** — Dados validados no servidor, não apenas client-side  
✅ **SMTP Seguro** — PHPMailer + TLS 587 + Base64 encoding  

## 📝 Blog — Como Adicionar Posts

Posts são definidos em `data/blog/posts.json`:

```json
[
  {
    "id": "meu-primeiro-post",
    "title": "Meu Primeiro Post",
    "date": "2026-01-15",
    "excerpt": "Resumo curto do post...",
    "image": "img/post-image.jpg",
    "category": "Marketing",
    "content": "<h2>Subtítulo</h2><p>HTML do conteúdo...</p>"
  }
]
```

**Passos:**
1. Adicione novo objeto em `posts.json`
2. Valide JSON: `php -r "json_decode(file_get_contents('data/blog/posts.json'), true) ?? exit(1); echo 'OK';"`
3. Teste em `http://localhost/blog/` (carrega automaticamente)
4. Commit e push

## 🚀 Deployment

### Requirements

- PHP 7.2+
- Apache com `mod_rewrite` ativo
- Composer instalado (`composer install`)
- Configurações em `server/credentials-local.php` (veja `server/credentials-local.example.php`)

### Pré-Deployment Checklist

- [ ] Copiar `credentials-local.example.php` → `credentials-local.php`
- [ ] Preencher `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD`
- [ ] Preencher `RECAPTCHA_SITEKEY` e `RECAPTCHA_SECRET`
- [ ] Rodar `composer install`
- [ ] Rodar `php scripts/setup-security.php` (permissões)
- [ ] Testar formulário em staging
- [ ] Testar blog em múltiplas resoluções
- [ ] Verificar PageSpeed Insights (target: 85+/100)

### Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Form não envia | Verifique `RECAPTCHA_SECRET`, SMTP credenciais |
| Blog não carrega | Valide `posts.json` com JSONLint |
| Imagem quebrada | Use caminhos relativos (`img/file.jpg`) |
| CSS com bug | Ctrl+F5 para limpar cache |
| Email não chega | Verifique domínio cadastrado em painel Zoho |

## 📖 Documentação

- **`README.md`** (este arquivo) — Apresentação geral do projeto
- **`README-EMAIL.md`** — Guia técnico completo para manutenção futura
  - Estrutura de arquivos com dicas por componente
  - Erros conhecidos e soluções
  - Monitoramento em produção
  - Scripts de deployment
  - Testes em diferentes navegadores

## 👥 Suporte & Contato

Para dúvidas técnicas, consulte `README-EMAIL.md` ou contacte os administradores da Sants Company.

- **Deploy e Manutenção:**
  - Arquivos sensíveis devem ser criados a partir dos exemplos e preenchidos localmente.
  - Dependências PHP gerenciadas via Composer.
  - Atualizações refletidas automaticamente no site após deploy.

## Como funciona o formulário de contato?
1. Usuário preenche o formulário em `/contato.html` ou na home.
2. Dados são enviados via POST para `server/contact.php`.
3. Backend valida campos, honeypot e reCAPTCHA (validado contra API do Google).
4. E-mail é enviado via SMTP (PHPMailer + Zoho Mail) com retry automático.
5. Resposta JSON para AJAX, exibindo feedback ao usuário.

### Fluxo de Segurança do reCAPTCHA

O reCAPTCHA é carregado **de forma diferida (lazy-loaded)** para melhorar a performance:
- **Desktop**: Script não é carregado até o usuário focar no formulário (focusin event)
- **Mobile**: Script não é carregado até o usuário tocar no campo (pointerdown event)
- A validação no backend checklist se a resposta é válida contra a API do Google via `server/contact.php`

**Configuração necessária:**
- `RECAPTCHA_SITEKEY` em cada `.html` (em `window.recaptchaSiteKey`)
- `RECAPTCHA_SECRET` em `server/credentials-local.php` (nunca em Git)
- O domínio deve estar cadastrado no painel do Google reCAPTCHA

## Performance & SEO Otimizações

### Arquitetura de Carregamento Lazy

O projeto utiliza estratégia de **carregamento diferido (lazy-loading)** para recursos não-críticos:

#### reCAPTCHA (Deferred)
```javascript
// Carregado apenas quando usuário interage com formulário
ensureRecaptchaApiLoaded(form); // focusin/pointerdown listeners
```
- **Ganho:** -600ms de bloqueio inicial
- **Estratégia:** Script injetado via createElement apenas quando necessário
- **Fallback:** Se não carregar, form fica de espera silenciosa (fail-silently)

#### Font Awesome (Deferred via requestIdleCallback)
```javascript
// Carregado após DOMContentLoaded em tempo ocioso
scheduleDeferredAssets(); // usa requestIdleCallback + 1.5s timeout
```
- **Ganho:** Não bloqueia renderização crítica
- **Técnica:** Link com `media="print"` + onload para evitar FOUT (Flash of Unstyled Text)
- **Fallback:** Retorna após 900ms se requestIdleCallback não executar

#### Google Fonts (Otimizado)
```html
<!-- Formato otimizado (weights reduzidos) -->
<link rel="preload" href="...Plus+Jakarta+Sans:wght@400;600;700&display=optional..." as="style">
<noscript><link rel="stylesheet" href="..."></noscript>
```
- **Ganho:** -~50KB vs. carregamento padrão com 4 weights
- **Tipografia:** Plus Jakarta Sans 400/600/700 (Outfit removido)
- **Display:** `optional` = usa fallback de sistema se não carregar em 0.1s

#### CSS (Modularizado)
- **main.css** (~72 KB): Estilos globais, hero, header, footer, layout
- **blog.css** (~8 KB): Estilos específicos do blog (carregado apenas em `/blog/`)
- **form-custom-select.css**: Preload com noscript fallback
- **Técnica:** Media queries `preload` + `onload` handler para evitar bloqueio

### Core Web Vitals Mitigations

| Métrica | Status | Mitigação |
|---------|--------|-----------|
| **FCP** (First Contentful Paint) | ✅ ~1.2s | Reduzidos assets blocking + preconnect otimizado |
| **LCP** (Largest Contentful Paint) | ✅ ~2.1s | Hero image otimizado + lazy-loading scripts |
| **CLS** (Cumulative Layout Shift) | ✅ 0 | `.global-header { min-height: 90px/78px }` reserva espaço |
| **TBT** (Total Blocking Time) | ✅ 0ms | Scripts deferred + requestIdleCallback |
| **SI** (Speed Index) | ✅ ~1.8s | CSS crítico + preload strategy |

### Recomendações de Maintenance

#### Cache e Compressão (via .htaccess)
```apache
# Ativar compressão GZIP
mod_deflate ativar para: text/*, application/javascript, application/json

# Cache de navegador (assets estáticos)
Cache-Control: max-age=31536000  # 1 ano para assets versionados
Cache-Control: max-age=3600      # 1 hora para HTML
```

#### Imagens e Mídia
- ✅ Use formatos modernos (WebP com fallback PNG/JPEG)
- ✅ Use atributos `width` e `height` (evita layout shift)
- ✅ Use lazy loading: `<img loading="lazy">`
- ✅ Otimize com TinyPNG, Squoosh ou ImageMagick

#### Scripts e Estilos
- ✅ Sempre teste minificação antes de aplicar
- ✅ Use `defer` em scripts para não bloquear renderização
- ✅ Evite CSS inline pesado (limite a <15KB)
- ✅ Combina arquivos JS/CSS quando possível (mas mantenha blog.css separado)

## Formulário & Email — Troubleshooting

### Erro: "SMTP Error: data not accepted"

**Causa Raiz:**
- Remetente (FROM) não corresponde a conta SMTP autenticada
- HTML muito complexo com muitos estilos inline
- Timeout curto demais para processar (Zoho precisa de 3-5s mínimo)
- Falta de versão plain text (AltBody) do email

**Solução Implementada em `server/contact.php`:**
```php
$mail->setFrom(FROM_EMAIL, 'Sants Company - Contato');     // ✅ Conta SMTP
$mail->addReplyTo($email, $name);                          // ✅ Cliente recebe em reply
$mail->Timeout = 10;                                       // ✅ 10 segundos
$mail->Body = $htmlBody;   // HTML simples
$mail->AltBody = $plainBody;  // Plain text fallback
$mail->CharSet = 'UTF-8';
$mail->Encoding = 'base64';
```

**Verificação rápida:**
1. Confirme `SMTP_HOST`, `SMTP_USERNAME`, `SMTP_PASSWORD` em `server/credentials-local.php`
2. Teste com `php server/contact.php` + `tail -f /var/log/apache2/error.log`
3. Verifique se o domínio está configurado no painel Zoho

### Erro: "Confirme o reCAPTCHA antes de enviar"

**Causa Raiz:**
- Script do Google ReCAPTCHA não carregou (extensão de bloqueio, cookie policy)
- Captcha não renderizado antes do submit
- Widget ID não foi salvo no elemento `.g-recaptcha`

**Verificação:**
1. Abra DevTools → Console → procure por erros de `grecaptcha`
2. Teste em aba anônima (desativa bloqueadores)
3. Confirme que `grecaptcha.ready()` é chamado após form focus

### Erro: "envio automático não respondeu corretamente"

**Causa Raiz:**
- `RECAPTCHA_SECRET` incorreto ou diferente entre painel Google e código
- Domínio não autorizado no painel Google reCAPTCHA
- Servidor não consegue acessar API Google (firewall/DNS)
- Token expirou (válido por 2 minutos)

**Verificação:**
1. Compare `RECAPTCHA_SECRET` em painel Google vs. `server/credentials-local.php`
2. Adicione seu domínio e localhost no painel Google reCAPTCHA
3. Teste conexão: `curl https://www.google.com/recaptcha/api/siteverify`
4. Verifique logs: `tail -f /var/log/php-errors.log`

## Manutenção & Deployment

### Setup Inicial

**1. Editor de Configurações (Obrigatório)**
```bash
# Copiar exemplo para local
cp server/credentials-local.example.php server/credentials-local.php
cp server/deploy-config.example.php server/deploy-config.php

# Preencher com valores reais:
# - SMTP_HOST, SMTP_USERNAME, SMTP_PASSWORD
# - RECAPTCHA_SECRET
# - WEBHOOK_SECRET (para deploy automático)
```

**2. Instalar Dependências**
```bash
composer install  # Instala PHPMailer e dependências
```

**3. Configurar Permissões**
```bash
php scripts/setup-security.php  # Configurar .htaccess e permissões
```

### Checklist Pré-Deployment

- [ ] `composer.lock` foi versionado e commitado
- [ ] `server/credentials-local.php` está com credenciais corretas
- [ ] Testou envio de email em staging
- [ ] Rodou `php scripts/setup-security.php` no servidor
- [ ] Verificou permissões de `storage/` (deve ser writable)
- [ ] Testou formulário em múltiplos navegadores/dispositivos
- [ ] Rodou PageSpeed Insights (target: 85+/100)
- [ ] Limpou cache CDN se aplicável

### Monitoramento em Produção

**Logs críticos:**
```bash
# Apache
tail -f /var/log/apache2/error.log    # Erros PHP/Web
tail -f /var/log/apache2/access.log   # Requisições HTTP

# PHP
tail -f /var/log/php-errors.log       # Erros PHP nativos

# Aplicação
grep "Error\|SMTP\|reCAPTCHA" /var/log/apache2/error.log
```

**Arquivos de dados:**
- `server/storage/contact-submissions.jsonl` — Backup local de submissões de formulário
- `server/storage/leads-render-test.html` — Teste de renderização (delete após testes)

**Limpeza periódica:**
```bash
# Remover backups após 30 dias
find blog/__backup__ -type f -mtime +30 -delete

# Arquivar submissões antigos (> 6 meses)
tar czf server/storage/submissions-2025-10.tar.gz \
  server/storage/contact-submissions.jsonl
```

### Composer & Dependências

**Atualizar PHPMailer (certifique-se de testar antes!):**
```bash
composer update phpmailer/phpmailer
# Depois, teste envio de email em staging
```

**Risco de incompatibilidade:**
Se o servidor usar PHP < 7.2 ou > 8.2, o `composer install` pode falhar. Confira:
```bash
php -v  # Verificar versão
composer install --no-dev  # Instalar sem dev dependencies
```

### Blog — Manutenção

**Estrutura de posts:**
```json
{
  "id": "slug-do-post",
  "title": "Título do Post",
  "date": "2026-01-15",
  "excerpt": "Resumo curto...",
  "image": "img/post-image.jpg",
  "category": "categoria",
  "content": "HTML do post..."
}
```

**Validar JSON antes de fazer push:**
```bash
php -r "json_decode(file_get_contents('data/blog/posts.json'), true); echo 'JSON OK';"
```

**Testar blog em múltiplas resoluções:**
```bash
# Desktop (1920x1080), Tablet (768x1024), Mobile (375x667)
# Usar Chrome DevTools Responsive Design
```

### Testes em Diferentes Navegadores

| Navegador | Actions |
|-----------|---------|
| **Chrome** | Teste form + blog, DevTools Lighthouse |
| **Firefox** | Teste responsividade, console errors |
| **Edge** | Verificar compatibilidade IE11 (fallbacks) |
| **Safari** | Testar em Mac/iPhone (flexbox, -webkit-) |
| **Mobile Chrome** | Testar touch, keyboard, swipe |

**Limpar cache antes de testar:**
```
Ctrl+Shift+Del  # Chrome/Edge
Cmd+Shift+Del   # Mac Chrome
Ctrl+H (History) + Clear Recent History  # Firefox
```

### Debugging Comum

| Problema | Verificação | Solução |
|----------|-------------|---------|
| Form não envia | DevTools → Network → POST falha | Verificar PHP errors, RECAPTCHA_SECRET |
| Blog não carrega | DevTools → Network → posts.json 404 | Verificar caminho em blog-list.js |
| CSS com bug | DevTools → Computed → checar cascata | Limpar cache (Ctrl+F5) |
| Imagem quebrada | DevTools → Network → image 404 | Verificar path (relativo vs. absoluto) |
| JS não executa | Console → syntax error | Verificar defer/async, minification |
| Email não entrega | Error log → SMTP | Verificar credenciais, domínio autorizado |

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
│   │   ├── form-custom-select.css       (preload strategy)
│   │   ├── main.css                     (~72 KB otimizado)
│   │   └── blog.css                     (blog-specific, ~8 KB)
│   ├── images/
│   │   ├── branding/
│   │   └── library/
│   └── js/
│       ├── blog-list.js             (carrega posts.json via AJAX)
│       ├── blog-post.js             (renderização de post individual)
│       ├── components.js            (inicializa componentes HTML)
│       ├── forms.js                 (lazy reCAPTCHA + form validation)
│       └── main.js                  (deferred Font Awesome + site init)
├── blog/
│   ├── index.html                   (lista de posts)
│   ├── post.html                    (template para post individual)
│   ├── __backup__/
│   └── img/                         (imagens de posts)
├── components/
│   ├── contact-form.html            (formulário com reCAPTCHA)
│   ├── footer.html
│   ├── header.html                  (header responsivo com menu)
│   ├── numeros-q-falam.html
│   ├── portfolio.html
│   └── reviews-google.html
├── data/
│   └── blog/posts.json              (estrutura de posts)
├── pages/
│   ├── contato.html                 (página de contato)
│   ├── servicos.html
│   └── sobre.html
├── scripts/
│   └── setup-security.php           (configura permissões)
├── server/
│   ├── contact.php                  (backend form + email SMTP)
│   ├── credentials-local.example.php
│   ├── credentials-local.php        (.gitignore'd)
│   ├── deploy-config.example.php
│   ├── deploy-config.php            (.gitignore'd)
│   ├── mail-config.php              (configurações de email)
│   ├── leads.php                    (gestão de conversões)
│   ├── storage/
│   │   ├── contact-submissions.jsonl (backup local de formulários)
│   │   └── leads-render-test.html
│   └── tools/
│       └── deploy-webhook.php       (GitHub webhook para deploy automático)
└── vendor/
    ├── autoload.php
    ├── composer/
    └── phpmailer/
        └── phpmailer/               (dependência: envio de emails)
```

## Tecnologias & Stack

| Camada | Tecnologia | Detalhes |
|--------|-----------|----------|
| **Frontend** | HTML5, CSS3, JavaScript | Puro (sem frameworks pesados) |
| **Performance** | Lazy-load, Preload, requestIdleCallback | reCAPTCHA, Font Awesome, Google Fonts |
| **Backend** | PHP 7.2+ | Arquitetura simples e direta |
| **Email** | PHPMailer + Zoho SMTP | TLS 587, UTF-8, Base64 encoding |
| **Segurança** | Google reCAPTCHA v2 | Validação no backend via API |
| **Servidor** | Apache | .htaccess para rewrite rules, compressão GZIP |
| **Dependências** | Composer | PHPMailer (única dependência produção) |
| **Versionamento** | Git | GitHub (repositório privado) |

## Histórico de Melhorias

### [2026-04-07] Performance Optimization Sprint (Scores: 52→86 Mobile, 71→97 Desktop)

**Implementações principais:**
✅ Lazy-load reCAPTCHA v3 (user interaction triggered) — ganho: -600ms bloqueio  
✅ Deferred Font Awesome (requestIdleCallback) — ganho: -~150ms bloqueio  
✅ Optimized Google Fonts (weights reduzidos) — ganho: -~50KB  
✅ CSS preload strategy para form-custom-select.css — ganho: render path otimizado  
✅ CLS mitigation com header space reservation — ganho: 0 CLS score  
✅ CSS cleanup (removal de comments) — ganho: -4.3 KB  
✅ Blog layout restoration (grid + responsivity) — ganho: mobile 48→86 score  

**Commits relacionados:**
- [282be60] perf: Optimize performance with deferred reCAPTCHA, Font Awesome, and CSS cleanup

### [2026-03-26] Email & Form Stability

- Corrigido erro "SMTP Error: data not accepted" (FROM inválido, HTML complexo, timeout curto)
- Adicionado plain text fallback (AltBody) em emails
- Implementado logging detalhado para debug de integração SMTP

## Observações Importantes

⚠️ **Este repositório é privado.** Não compartilhe credenciais, chaves de API ou arquivos `.example.php` fora do time.

✅ **Documentação confidencial:** Consulte `README-EMAIL.md` para:
- Histórico de bugs e soluções
- Detalhes de autenticação e configuração
- Problemas conhecidos de deploy

🔧 **Suporte técnico:** Para dúvidas sobre estrutura, performance, ou deployment, revise este README + `README-EMAIL.md` ou contate os administradores da Sants Company.
