# Sants Company Website

Site institucional responsivo da **Sants Company**, agência especializada em **marketing digital e desenvolvimento web**, com 2 anos de experiência e mais de 10 projetos entregues.

---

## 📋 Sobre o Projeto

Este é o site institucional da Sants Company — uma solução completa que apresenta a empresa, seus serviços e permite contato direto com clientes através de um formulário otimizado.

**O que oferece:**
- Homepage com apresentação visual e hero section
- Blog com curadoria RSS em PT-BR e artigos autorais da Sants Company
- Páginas institucionais (sobre, serviços, contato)
- Formulário de contato com validação e proteção anti-spam
- Responsivo e otimizado para mobile, tablet e desktop
- Máxima performance (PageSpeed 86/100 mobile, 97/100 desktop)

---

## Sobre a Sants Company

A **Sants Company** é uma agência de marketing e programação que atua na criação de soluções digitais para empresas. O site é o cartão de visita digital da empresa, apresentando:

- Identidade visual profissional (design moderno e acessível)
- Portfólio de serviços
- Blog educativo sobre marketing e tecnologia
- Central de contato para leads

---

## Stack & Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript Puro |
| **Backend** | PHP 7.2+ |
| **Email** | PHPMailer + Resend API |
| **Segurança** | Google reCAPTCHA v3 |
| **Servidor** | Apache com mod_rewrite |
| **Versionamento** | Git + GitHub |
| **CMS/Blog** | JSON + JavaScript, RSS próprio e curadoria automatizada |

---

## APIs Integradas

1. **Google reCAPTCHA v3** — Proteção contra bots no formulário
   - Validação backend obrigatória
   - Honeypot invisível para detectar automação

2. **Google Fonts** — Tipografia otimizada
   - Plus Jakarta Sans (400/600/700 weights)
   - Display=optional (fallback sistema)

---

## Cronograma de Desenvolvimento

- **Início:** Março 2026
- **Performance Sprint:** Abril 2026 (otimizações principais)
- **Status:** Em produção, com manutenção contínua de conteúdo e performance

---

## Estrutura Geral

```
Sants Company/
├── index.html             (página inicial)
├── pages/                 (contato, serviços, sobre)
├── blog/                  (blog dinâmico)
├── components/            (header, footer, forms)
├── assets/
│   ├── css/               (main.css, blog.css, form-custom-select.css)
│   ├── js/                (main.js, forms.js, blog-list.js, etc)
│   └── images/            (branding, acervos)
├── server/                (PHP backend, configs, storage)
├── data/blog/             (posts.json - estrutura de posts)
├── README.md              (este arquivo)
└── README-EMAIL.md        (.gitignore'd - documentação técnica)
```

---

## Formulário de Contato

O site permite que visitantes entrem em contato diretamente através de um formulário:

1. Usuário preenche nome, email e mensagem
2. Dados são validados (client e server)
3. reCAPTCHA protege contra bots
4. Email é enviado via Zoho SMTP
5. Feedback é exibido ao usuário

**Segurança:**
- ✅ reCAPTCHA v3 obrigatório
- ✅ Validação de formato (email, etc)
- ✅ Rate limiting (1 envio/min por IP)
- ✅ Honeypot invisível

---

## Blog Dinâmico

Posts são armazenados em JSON e renderizados via JavaScript:

```json
{
  "id": "slug-post",
  "title": "Título",
  "date": "2026-04-07",
  "excerpt": "Resumo...",
  "image": "img/post.jpg",
  "category": "Marketing",
  "content": "<h2>HTML do post</h2>"
}
```

Adicionar novo post:
1. Editar `data/blog/posts.json`
2. Validar sintaxe
3. Commit e push

---

## Performance

| Métrica | Valor |
|---------|-------|
| PageSpeed Mobile | 86/100 |
| PageSpeed Desktop | 97/100 |
| FCP | ~1.2s |
| LCP | ~2.1s |
| CLS | 0.0 |
| TBT | 0ms |

Otimizações principais:
- Lazy-load de recursos não-críticos (reCAPTCHA, Font Awesome)
- CSS modularizado por página
- Imagens otimizadas (WebP com fallback)
- Compressão GZIP via Apache

---

## Documentação

**README.md** (este arquivo)
- Apresentação do projeto
- Stack e APIs usadas
- Estrutura geral

**README-EMAIL.md** (confidencial)
- Documentação técnica completa
- Guia de manutenção e troubleshooting
- Deployment e configuração
- Monitoramento em produção

*Nota: README-EMAIL.md contém informações sensíveis e está no `.gitignore`. Consulte apenas se necessário.*

---

## Contato

Para dúvidas sobre o projeto:
- Contacte os administradores da Sants Company
- Consulte a documentação técnica (README-EMAIL.md) para questões de implementação

