# Guia de Desenvolvimento Local

## ⚡ TL;DR (Resumo Rápido)

```bash
# Primeira vez
npm install

# Toda vez que quer desenvolver
npm run dev

# Acesse http://localhost:3000
```

---

## Como Rodar em Desenvolvimento

### Opção 1: Full Stack (Recomendado) ⭐

```bash
# Na pasta do projeto
npm run dev
```

Isso vai:

- ✓ Rodar o frontend em `http://localhost:3000` (Vite)
- ✓ Rodar as APIs em `http://localhost:3001` (Express)
- ✓ Proxy automático: o Vite redireciona `/api/*` para o Express
- ✓ Carregar as variáveis do `.env` e `.env.local`
- ✓ Hot-reload tanto no frontend quanto no backend

**Acesse**: http://localhost:3000

### Opção 2: Frontend Apenas

Se quiser apenas testar o frontend sem as APIs:

```bash
npm run dev:front
```

Isso vai rodar apenas o Vite em `http://localhost:3000`, mas as APIs não funcionarão.

### Opção 3: Backend Apenas

```bash
npm run dev:back
```

Roda apenas o servidor Express em `http://localhost:3001`.

### Opção 4: Produção Local (Preview Build)

```bash
# Build do frontend
npm run build

# Preview do frontend
npm run preview
```

---

## Estrutura de Pastas e Arquivos

```
estoque/
├── src/                    ← Frontend React (hot-reload)
├── backend/                ← Backend Express (hot-reload com tsx)
│   ├── index.ts            ← Entry point
│   ├── routes/             ← Rotas da API
│   ├── middleware/         ← Middleware (auth, etc.)
│   └── lib/                ← Prisma client
├── api/                    ← Vercel Functions (apenas para deploy)
├── .env                    ← Variáveis públicas (commitar)
├── .env.local              ← Variáveis privadas (NÃO commitar)
└── .gitignore              ← Já configurado para .env.local
```

---

## Variáveis de Ambiente

### `.env` (Committed no Git)

```
VITE_API_URL=http://localhost:3000/api
NODE_ENV=development
```

Valores padrão compartilhados com toda a equipe.

### `.env.local` (NÃO Committed)

```
DATABASE_URL=postgresql://...
JWT_SECRET=sua-chave-super-secreta
```

Valores privados da sua máquina. O `.env.local` está no `.gitignore`.

### Vercel Dashboard

Variáveis de produção - não existem em arquivo local.

---

## Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev              # Frontend + Backend (localhost:3000) ⭐
npm run dev:front        # Frontend apenas (localhost:3000)
npm run dev:back         # Backend Express apenas (localhost:3001)
npm start                # Alias para dev

# Build & Preview
npm run build            # Build Vite (frontend)
npm run build:back       # Build TypeScript do backend
npm run preview          # Preview do build do frontend

# Prisma
npm run prisma:generate  # Gerar cliente Prisma
npm run prisma:migrate   # Criar migrações
npm run prisma:db-push   # Push schema (dev only)
npm run prisma:studio    # Inspecionar banco em http://localhost:5555

# Linting
npm run lint             # Verificar código
```

---

## Testando APIs em Desenvolvimento

### Com o servidor rodando (localhost:3001 direto ou :3000 via proxy)

```bash
# Listar filiais (público)
curl http://localhost:3000/api/public/filiais
# Ou direto no backend
curl http://localhost:3001/api/public/filiais

# Login
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com", "password": "senha"}'

# Usar token em requisições
TOKEN="seu_token_aqui"
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN"
```

---

## Debugging

### Ver Logs do Vercel Dev

```bash
# Rodar com verbose
vercel dev --debug
```

### Ver Logs do Prisma

```bash
# Ativar debug
export DEBUG=prisma:*
npm run dev:vercel
```

### Prisma Studio

Interface visual para ver dados do banco:

```bash
npm run prisma:studio
```

Abre em `http://localhost:5555`

### Verificar Porta em Uso

```bash
# Windows - Ver o que está na porta 3000
netstat -ano | findstr :3000

# Matar processo (substitua <PID> pelo número)
taskkill /PID <PID> /F
```

---

## Resolução de Problemas

### "Erro: ECONNREFUSED em /api"

**Problema**: Backend Express não está rodando

**Solução**:

1. Verifique se o backend está rodando: `npm run dev:back`
2. Verifique se a porta 3001 está livre
3. Ctrl+C e rode `npm run dev` novamente

### "Porta 3000 já está em uso"

**Problema**: Outro programa está usando a porta 3000

**Solução**:

```bash
# Matar processo anterior
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou usar porta diferente
vercel dev --port 3001
```

### "Banco de dados não conecta"

**Problema**: `DATABASE_URL` está incorreta ou banco está offline

**Solução**:

1. Verifique se `DATABASE_URL` em `.env.local` está correta
2. Teste com `npm run prisma:studio`
3. Verifique se o banco está online (Neon, AWS, etc)

### "Hot-reload não funciona"

**Problema**: Mudanças em arquivos não refletem automaticamente

**Solução**:

```bash
# Restart forçado
Ctrl+C
npm run dev:vercel
```

### "Erro: Cannot find module '@prisma/client'"

**Problema**: Prisma não foi gerado

**Solução**:

```bash
npm run prisma:generate
npm run dev:vercel
```

---

## Fluxo de Desenvolvimento

```
1. npm run dev
   ↓
2. Faça mudanças em src/ ou backend/
   ↓
3. Hot-reload automático (Ctrl+Shift+R para forçar browser)
   ↓
4. Teste no navegador e com curl/Postman
   ↓
5. Quando satisfeito, commit e push
   ↓
6. Vercel faz deploy automático (usando api/ para serverless)
```

---

## Boas Práticas

✅ Use `npm run dev` para desenvolvimento completo
✅ Coloque dados sensíveis em `.env.local` (nunca commitar!)
✅ Teste as APIs com curl ou Postman
✅ Use Prisma Studio para debugar banco de dados
✅ Commit apenas mudanças no código, não em arquivos .env
✅ Mantenha `.env.local` sincronizado com `.env` em variáveis públicas

---

## Checklist de Setup Inicial

- [ ] Node.js v18+ instalado (`node --version`)
- [ ] npm packages instalados (`npm install`)
- [ ] Backend Express configurado
- [ ] `.env.local` criado com suas variáveis
- [ ] `DATABASE_URL` está funcionando
- [ ] `npm run dev` roda sem erros
- [ ] http://localhost:3000 carrega
- [ ] `/api/public/filiais` retorna dados

---

## Próximos Passos

1. ✅ Rode `npm run dev`
2. ✅ Acesse http://localhost:3000
3. ✅ Teste as APIs (veja EXEMPLOS_API.md)
4. ✅ Faça suas mudanças
5. ✅ Commit e push para GitHub
6. ✅ Deploy automático na Vercel!

**Agora você está desenvolvendo localmente igual será em produção! 🚀**

---

## Referências

- [Vercel Dev Documentation](https://vercel.com/docs/cli)
- [Vite Documentation](https://vitejs.dev)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vercel Functions](https://vercel.com/docs/functions/serverless-functions)
