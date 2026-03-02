# 🚀 DEPLOY HOSTINGER - SISTEMA ULTRA-SEGURO

## 📋 **PASSO A PASSO COM CRIPTOGRAFIA AES-256**

### **1️⃣ CONFIGURAÇÃO SEGURA LOCAL**
- ❌ **NÃO edite arquivos manualmente!**
- ✅ **Use o sistema de segurança:** `http://localhost/setup-security.php`
- 🔐 **Digite sua senha uma vez** - será criptografada com AES-256

### **2️⃣ UPLOAD DOS ARQUIVOS**
Faça upload de **TODOS** os arquivos para `public_html`:

```
public_html/
├── index.html
├── send.php
├── config.php
├── credentials-local.php      ← SENHA CRIPTOGRAFADA (seguro!)
├── composer.json
├── .htaccess                  ← PROTEÇÃO MILITAR
├── .gitignore
├── css/style.css
├── js/script.js
├── img/ (suas imagens)
└── SISTEMA-SEGURO.md         ← LEIA ESTE GUIA
```

### **3️⃣ INSTALAR PHPMAILER NO SERVIDOR**
Via SSH ou File Manager do Hostinger:

```bash
cd public_html
composer install --no-dev --optimize-autoloader
```

### **4️⃣ TESTE FINAL**
- Acesse: `https://seudominio.com`
- Preencha o formulário
- Complete o captcha
- ✅ **Email chegará criptografado e seguro!**

---

## 🔧 **ESTRUTURA DO PROJETO**

### **Tecnologias:**
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: PHP 8+ com PHPMailer
- **Anti-Spam**: hCaptcha (gratuito)
- **Servidor**: SMTP Zoho

### **Arquivos Críticos:**
- 🔑 `credentials-local.php` - **ÚNICO arquivo para editar**
- 📧 `send.php` - Processamento com anti-spam
- 🤖 `index.html` - Formulário com captcha
- ⚙️ `config.php` - Configuração SMTP

### **Dependências:**
- 📦 `vendor/` - Criada automaticamente pelo Composer
- 🔒 `phpmailer/phpmailer` - Biblioteca de email

---

## 🛡️ **SEGURANÇA INCLUÍDA**

- ✅ **Anti-Robô**: hCaptcha com verificação dupla
- ✅ **Anti-Spam**: Headers profissionais
- ✅ **Proteção**: .htaccess bloqueia acesso direto
- ✅ **Validação**: Sanitização de dados
- ✅ **Rate Limit**: Via hCaptcha (automático)

---

## 🆘 **RESOLUÇÃO DE PROBLEMAS**

### **❌ Erro: "Class PHPMailer not found"**
**Solução:** Execute `composer install` no servidor

### **❌ Emails indo para SPAM**
**Solução:** Sistema já tem anti-spam. Aguarde reputação do domínio.

### **❌ Captcha não funciona**
**Solução:** Verifique se o domínio permite JavaScript externo

### **❌ Erro 500**
**Solução:** Verifique permissões dos arquivos (755 pastas, 644 arquivos)

---

## ✅ **CHECKLIST FINAL**

- [ ] Arquivos enviados para `public_html`
- [ ] `composer install` executado
- [ ] Senha configurada em `credentials-local.php`
- [ ] Teste do formulário realizado
- [ ] Email recebido com sucesso

**🎉 Sistema 100% pronto para produção!**