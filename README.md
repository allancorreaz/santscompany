# Sants Company

Site institucional da Sants Company, agência de desenvolvimento web e marketing digital. O projeto apresenta serviços, portfólio, artigos autorais, notícias curadas e canais de contato direto para empresas.

## Atuação

- Desenvolvimento web: sites institucionais, landing pages, e-commerces, sistemas, integrações e manutenção técnica.
- Marketing e conteúdo: social media, mídia paga, SEO, web design e produção de vídeo.
- Operação próxima: Allan Correia conduz a frente técnica; Jean conduz marketing, conteúdo e audiovisual. Os sócios acompanham planejamento, execução e entrega.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | HTML, CSS e JavaScript sem framework |
| Backend | PHP |
| Formulário | Resend, validação no servidor, reCAPTCHA, honeypot e limitação por IP |
| Blog | JSON, JavaScript, RSS próprio e curadoria automatizada |
| Infraestrutura | Apache, GitHub e Hostinger |
| Versionamento | Git e GitHub |

## Estrutura

```text
.
├── assets/            estilos, scripts, imagens e fontes
├── blog/              listagem, RSS e páginas de artigos
├── components/        header, footer, formulário e serviços reutilizáveis
├── data/blog/         posts próprios e notícias geradas
├── docs/              documentação interna bloqueada do acesso público
├── pages/             páginas institucionais
├── server/            formulário e coleta de notícias
├── index.html
└── sitemap.xml
```

## Blog

Os artigos próprios são mantidos em `data/blog/posts.json`. As notícias externas são coletadas por `server/fetch-news.php`, traduzidas para PT-BR e gravadas em `data/blog/news.json` no servidor. Esse arquivo é gerado e não deve ser enviado ao repositório.

A estratégia editorial, o calendário e a rotina de atualização estão em `docs/EDITORIAL-STRATEGY.md`, `docs/editorial-calendar.csv` e `docs/CONTENT-MAINTENANCE.md`.

## Publicação

O fluxo normal é:

```bash
git add .
git commit -m "tipo: descrição objetiva"
git push origin HEAD:main
```

O webhook atualiza o clone Git na Hostinger. Um cron de sincronização publica os arquivos na raiz servida, preservando `server/credentials-local.php` e `data/blog/news.json`. Não é necessário executar comandos por SSH a cada commit.

## Segurança

Credenciais, tokens, logs, dados de leads e arquivos gerados ficam fora do Git. O Apache bloqueia acesso público a diretórios internos, arquivos de configuração e o coletor de notícias. O formulário valida entradas no servidor, limita tentativas e usa mecanismos anti-spam.

## Documentação interna

`docs/PROJECT-OPERATIONS.md` descreve arquitetura, deploy, segurança e manutenção. Não inclua segredos nessa documentação nem em commits.
