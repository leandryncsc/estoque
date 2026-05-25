# Guia de Deploy na Vercel

## Pré-requisitos

1. Conta no GitHub
2. Conta na Vercel
3. Seu banco de dados PostgreSQL (Neon, AWS RDS, etc.)

## Passo 1: Preparar o Repositório Git

```bash
# Navegar para o projeto
cd "C:\Users\leand\OneDrive\Área de Trabalho\estoque"

# Verificar status
git status

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "feat: unify server with main project for Vercel deployment"

# Push para GitHub (substitua pela sua branch)
git push origin main
```

## Passo 2: Conectar ao Vercel

### Opção A: Via Dashboard do Vercel (Recomendado)

1. Acesse https://vercel.com/dashboard
2. Clique em "Add New..." → "Project"
3. Selecione "Import Git Repository"
4. Procure pelo seu repositório no GitHub
5. Clique em "Import"

### Opção B: Via CLI do Vercel

```bash
# Instalar Vercel CLI (global)
npm install -g vercel

# Fazer login
vercel login

# Deploy do projeto
vercel
```

## Passo 3: Configurar Variáveis de Ambiente

Na tela de configuração do Vercel, adicione:

**Environment Variables:**

```
NAME: DATABASE_URL
VALUE: postgresql://usuario:senha@host:5432/database?sslmode=require

NAME: JWT_SECRET
VALUE: uma-chave-aleatoria-forte-e-segura-muito-comprida

NAME: NODE_ENV
VALUE: production
```

⚠️ **SEGURANÇA**:

- Não use a mesma JWT_SECRET do desenvolvimento
- Gere uma chave forte: use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Passo 4: Revisar Configurações de Build

Vercel deve detectar automaticamente:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

Se não detectar, configure manualmente no Vercel Dashboard.

## Passo 5: Deploy

1. Clique em "Deploy"
2. Aguarde a build completar (geralmente 2-5 minutos)
3. Após sucesso, você receberá uma URL como:
   ```
   https://seu-projeto.vercel.app
   ```

## Verificar o Deploy

1. Acesse sua URL no navegador
2. A página inicial deve carregar
3. Teste as APIs:

   ```bash
   # Verificar filiais públicas
   curl https://seu-projeto.vercel.app/api/public/filiais

   # Fazer login
   curl -X POST https://seu-projeto.vercel.app/api/auth \
     -H "Content-Type: application/json" \
     -d '{"email": "seu@email.com", "password": "senha"}'
   ```

## Configurações Recomendadas do Vercel

### 1. Auto-Deployments

Na aba **Settings** → **Git**:

- ✅ Enabled (padrão)
- Fará deploy automático ao fazer push

### 2. Production Branch

- Defina como `main`
- Só esta branch fará deploy em produção

### 3. Preview Deployments

- Ativado por padrão
- Cada pull request gera uma URL de preview

### 4. Domains

Na aba **Domains**:

- Você pode adicionar um domínio customizado
- Configure seu DNS conforme instruído pelo Vercel

## Monitorar o Deploy

### Logs

```bash
# Ver logs em tempo real
vercel logs https://seu-projeto.vercel.app --tail
```

Ou acesse via Dashboard:

1. Selecione o projeto
2. Aba "Deployments"
3. Clique em um deploy
4. Veja os logs

### Métricas

Acesse **Analytics** no Dashboard para:

- Tempo de resposta das APIs
- Taxa de erro
- Uso de banda

## Troubleshooting

### Erro: Build failed

**Causa comum**: Variáveis de ambiente não configuradas

**Solução**:

1. Verifique se `DATABASE_URL` e `JWT_SECRET` estão no Vercel
2. Revise os logs de build
3. Execute `npm run build` localmente para testar

### Erro: Cannot find module '@prisma/client'

**Causa**: Prisma não foi gerado

**Solução**:

1. Verifique se `npm install` rodou
2. Verifique o `prisma.config.ts`
3. Re-deploy

### Erro: Database connection refused

**Causa**: `DATABASE_URL` está incorreta ou banco está inativo

**Solução**:

1. Verifique a URL no `.env` local
2. Teste a conexão: `npm run prisma:studio` (localmente)
3. Confirme que o banco está online

### API retorna 500

**Causa**: Geralmente erro na autenticação JWT

**Solução**:

1. Verifique se `JWT_SECRET` está configurada
2. Verifique se está a mesma em todas as environments
3. Revise os logs do Vercel

## Deploy Contínuo

Depois de configurado, o processo é automático:

1. Você faz push para GitHub
2. Vercel detecta a mudança
3. Vercel roda o build
4. Se sucesso, faz deploy automaticamente
5. Nova URL está pronta

**Não precisa fazer nada mais!**

## Rollback

Se algo deu errado:

1. Acesse Vercel Dashboard
2. **Deployments**
3. Selecione um deployment anterior
4. Clique em **Promote to Production**

## URLs de Ambiente

### Desenvolvimento Local

```
Frontend: http://localhost:3000
API: http://localhost:3000/api
```

### Produção (Vercel)

```
Frontend: https://seu-projeto.vercel.app
API: https://seu-projeto.vercel.app/api
```

## Atualizar Domínio no Frontend

Se configurou um domínio customizado, atualize no frontend:

**Arquivo**: `src/` (ou onde está configurada a URL da API)

```typescript
// Antes (desenvolvimento)
const API_URL = "http://localhost:3000/api";

// Depois (produção)
const API_URL = "https://seu-dominio.com/api";
// Ou use variável de ambiente:
const API_URL =
  import.meta.env.VITE_API_URL || "https://seu-projeto.vercel.app/api";
```

## Próximas Etapas

1. ✅ Deploy de produção está online
2. Configure domínio customizado (opcional)
3. Configure SSL (automático no Vercel)
4. Monitore performance e erros
5. Configure alertas (opcional)

## Suporte

- **Documentação Vercel**: https://vercel.com/docs
- **Status**: https://www.vercelstatus.com
- **Discord Vercel**: https://discord.gg/vercel

---

🎉 **Seu projeto está pronto para produção!**
