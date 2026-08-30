# Operação interna do projeto

## Arquitetura

O site é estático no frontend, com HTML, CSS e JavaScript. Componentes comuns são carregados de `components/`. O formulário usa endpoints PHP em `server/`. O blog combina artigos próprios de `data/blog/posts.json` com notícias curadas geradas em `data/blog/news.json` pelo coletor PHP. Credenciais e o arquivo de notícias gerado não entram no Git.

## Publicação

1. Faça alterações locais e valide arquivos alterados.
2. Execute `git add`, `git commit` e `git push origin HEAD:main`.
3. O webhook do GitHub atualiza o clone da Hostinger.
4. O cron de sincronização copia o clone para a raiz pública, preservando `server/credentials-local.php` e `data/blog/news.json`.

O diretório de clone é separado da raiz servida por decisão da Hostinger. A atualização do site pode levar até o intervalo configurado no cron de sincronização. Não é necessário entrar por SSH em uma publicação normal; use SSH somente para diagnóstico.

## Notícias RSS

`server/fetch-news.php` busca fontes RSS, traduz títulos e resumos pelo DeepL e gera `data/blog/news.json`. O cron de notícias deve rodar a cada quatro horas. O arquivo mantém itens recentes e um arquivo de notícias para evitar que o blog perca histórico imediatamente.

## Segurança

- `server/credentials-local.php` permanece apenas no servidor e é bloqueado por `.htaccess`.
- O coletor de notícias não pode ser chamado por HTTP.
- Logs, bancos locais, diretórios VCS e metadados de dependências são bloqueados pelo Apache.
- O formulário usa validação no servidor, honeypot, reCAPTCHA e limitação por IP.
- Nunca registre tokens, senhas, chaves DeepL, SMTP ou dados de leads em arquivos versionados.

## Conteúdo

A estratégia, o calendário e a rotina de revisão ficam em `docs/`. Este diretório é bloqueado do acesso público. O formato publicado permanece em `data/blog/posts.json`; páginas próprias existentes ficam em `blog/posts/`.