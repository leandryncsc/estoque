# 🚀 GUIA DE DEPLOYMENT - VERCEL

## ⚠️ PROBLEMA ATUAL

Você está recebendo erro **500** ao fazer login em produção. Isso geralmente significa:

1. **DATABASE_URL não está configurada no Vercel**
2. **Banco de dados não é acessível da internet**
3. **Variáveis de ambiente faltam**

## 📋 CHECKLIST DE DEPLOYMENT

### 1️⃣ Configurar Variáveis de Ambiente no Vercel

1. Vá para: https://vercel.com/[seu-projeto]/settings/environment-variables
2. Adicione as seguintes variáveis:

```
JWT_SECRET = [gere uma chave aleatória]
DATABASE_URL = postgresql://usuario:senha@host:5432/database
ALLOWED_ORIGINS = https://seu-dominio-vercel.app
```

**Para gerar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2️⃣ Banco de Dados PostgreSQL

Opções recomendadas:
- **Vercel Postgres** (mais fácil): https://vercel.com/docs/storage/postgres
- **Supabase** (grátis): https://supabase.com
- **Render**: https://render.com
- **Railway**: https://railway.app

### 3️⃣ Build e Deploy

```bash
# Localmente, teste antes de fazer deploy
npm run build:all
npm start

# Se funcionar, faça push para GitHub
git push origin main  # Vercel redeploya automaticamente
```

### 4️⃣ Executar Migrations do Prisma

Após configurar DATABASE_URL, execute:

```bash
npx prisma migrate deploy
# ou se nunca rodou migrations
npx prisma migrate dev --name init
```

## 🔍 TESTE SE ESTÁ FUNCIONANDO

Após deploy, teste a URL de health:
```
https://seu-dominio.vercel.app/api/health
```

Deve retornar:
```json
{
  "status": "ok",
  "timestamp": "2026-05-22T10:00:00.000Z"
}
```

## 📊 TROUBLESHOOTING

### Erro 500 ao fazer login
- ✅ DATABASE_URL está configurada?
- ✅ Banco é acessível publicamente?
- ✅ JWT_SECRET está definido?

### Erro 404 no frontend
- ✅ Build foi completado? (`npm run build:all`)
- ✅ Arquivo `dist/` foi gerado?

### CORS error
- ✅ ALLOWED_ORIGINS inclui seu domínio Vercel?
- ✅ Protocolo está correto (https)?

## 🛠️ LOGS DO VERCEL

Para ver erros em tempo real:
```bash
vercel logs [seu-projeto] --follow
```

Ou use o painel: https://vercel.com/[seu-projeto]/logs

## ✅ SUCESSO!

Se tudo estiver configurado:
1. Login funcionará
2. Dados serão salvos no banco
3. Aplicação estará em produção

Qualquer dúvida, verifique os logs do Vercel! 🔍
