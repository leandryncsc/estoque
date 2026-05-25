# Guia de Desenvolvimento Local

## ⚡ TL;DR (Resumo Rápido)

```bash
# Primeira vez
npm install -g vercel

# Toda vez que quer desenvolver
npm run dev:vercel

# Acesse http://localhost:3000
```

---

## Como Rodar em Desenvolvimento

### Opção 1: Com Vercel Dev (Recomendado) ⭐

**Primeira vez:**

```bash
# Instalar Vercel CLI globalmente
npm install -g vercel

# Fazer login no Vercel (opcional, mas recomendado)
vercel login
```

**Sempre que quiser desenvolver:**

```bash
# Na pasta do projeto
npm run dev:vercel

# Ou use o alias
npm start
```

Isso vai:

- ✓ Rodar o frontend em `http://localhost:3000` (Vite)
- ✓ Rodar as APIs em `http://localhost:3000/api` (Vercel Functions)
- ✓ Carregar as variáveis do `.env` e `.env.local`
- ✓ Usar hot-reload para mudanças
- ✓ Simular exatamente como funciona em produção

**Acesse**: http://localhost:3000

### Opção 2: Frontend Apenas

Se quiser apenas testar o frontend sem as APIs:

```bash
npm run dev
```

Isso vai rodar apenas o Vite em `http://localhost:3000`, mas as APIs não funcionarão localmente.
Use quando quiser trabalhar apenas na UI/UX sem mexer com backend.

### Opção 3: Produção Local (Preview Build)

Para simular exatamente como ficará em produção:

```bash
# Build para produção
npm run build

# Preview local (simula Vercel)
vercel build
vercel start
```

---

## Estrutura de Pastas e Arquivos

```
estoque/
├── src/                    ← Frontend React (hot-reload)
├── api/                    ← Backend API Routes (hot-reload)
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
npm run dev:vercel       # Frontend + APIs (localhost:3000) ⭐
npm run dev              # Frontend apenas (localhost:3000)
npm start                # Alias para dev:vercel

# Build & Preview
npm run build            # Build Vite
npm run preview          # Preview do build

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

### Com Vercel Dev (localhost:3000)

```bash
# Listar filiais (público)
curl http://localhost:3000/api/public/filiais

# Login
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com", "password": "senha"}'

# Usar token em requisições
TOKEN="seu_token_aqui"
curl http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN"
```

### Com Frontend Apenas (localhost:3000)

Você precisa alterar `VITE_API_URL` em `.env.local`:

```env
# Para uma API em produção
VITE_API_URL=https://seu-projeto.vercel.app/api

# Ou deixe vazio para usar requisições relativas
VITE_API_URL=
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

**Problema**: Vercel Dev não está rodando ou APIs não carregaram

**Solução**:

1. Aguarde a build das APIs terminar (veja na saída do terminal)
2. Verifique se não há erros em arquivos dentro de `/api`
3. Ctrl+C e rode `npm run dev:vercel` novamente

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
1. npm run dev:vercel
   ↓
2. Faça mudanças em src/ ou api/
   ↓
3. Hot-reload automático (Ctrl+Shift+R para forçar browser)
   ↓
4. Teste no navegador e com curl/Postman
   ↓
5. Quando satisfeito, commit e push
   ↓
6. Vercel faz deploy automático
```

---

## Boas Práticas

✅ Use `npm run dev:vercel` para desenvolvimento completo
✅ Coloque dados sensíveis em `.env.local` (nunca commitar!)
✅ Teste as APIs com curl ou Postman
✅ Use Prisma Studio para debugar banco de dados
✅ Commit apenas mudanças no código, não em arquivos .env
✅ Mantenha `.env.local` sincronizado com `.env` em variáveis públicas

---

## Checklist de Setup Inicial

- [ ] Node.js v18+ instalado (`node --version`)
- [ ] npm packages instalados (`npm install`)
- [ ] Vercel CLI instalado (`npm install -g vercel`)
- [ ] `.env.local` criado com suas variáveis
- [ ] `DATABASE_URL` está funcionando
- [ ] `npm run dev:vercel` roda sem erros
- [ ] http://localhost:3000 carrega
- [ ] `/api/public/filiais` retorna dados

---

## Próximos Passos

1. ✅ Rode `npm run dev:vercel`
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
