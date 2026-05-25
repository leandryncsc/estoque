# Migração Completada - Server Unificado com Projeto Vite

Sua pasta do server foi unificada com sucesso ao projeto principal! Agora você pode hospedar tudo na Vercel como um projeto padrão Vercel.

## Mudanças Realizadas

### 1. **Estrutura de API Routes (Vercel Functions)**
- Criada pasta `/api` com toda a estrutura de rotas usando Vercel Functions
- Cada endpoint Express foi convertido para uma Vercel Function TypeScript
- Endpoints estão organizados por recurso:
  - `/api/auth/` - Autenticação (login, register, me)
  - `/api/products/` - Gerenciamento de produtos
  - `/api/users/` - Gerenciamento de usuários
  - `/api/suppliers/` - Gerenciamento de fornecedores
  - `/api/sales/` - Processamento de vendas
  - `/api/stock-movements/` - Movimentos de estoque
  - `/api/filiais/` - Gerenciamento de filiais
  - `/api/dashboard/stats` - Estatísticas do dashboard
  - `/api/reports/` - Relatórios
  - `/api/settings/` - Configurações do sistema
  - `/api/public/filiais` - Filiais (rota pública)
  - `/api/public/check-admin` - Verificar admin (rota pública)

### 2. **Dependências Adicionadas ao package.json**
- `@prisma/client` - ORM para banco de dados
- `@vercel/node` - Types para Vercel Functions
- `bcryptjs` - Hash de senhas
- `cors` - CORS middleware
- `dotenv` - Variáveis de ambiente
- `jsonwebtoken` - JWT para autenticação

### 3. **Configuração Prisma**
- Pasta `prisma/` copiada para a raiz do projeto
- `prisma.config.ts` criado na raiz
- `api/lib/prisma.ts` - Singleton do Prisma Client para serverless

### 4. **Variáveis de Ambiente (.env)**
```
VITE_API_URL=""
DATABASE_URL="postgresql://..."
JWT_SECRET="super-secret-key-mude-em-producao"
NODE_ENV="development"
```
⚠️ **IMPORTANTE**: Mude a `JWT_SECRET` em produção!

### 5. **Configuração Vercel (vercel.json)**
- Adicionadas rewrites para redirecionar corretamente as rotas da API

## Como Usar

### Desenvolvimento Local

1. **Instalar dependências:**
```bash
npm install
```

2. **Gerar Prisma Client:**
```bash
npm run prisma:generate
```

3. **Executar em modo desenvolvimento:**
```bash
npm run dev
```

4. **Visualizar banco de dados (Prisma Studio):**
```bash
npm run prisma:studio
```

### Deploy na Vercel

1. **Push seu código para GitHub:**
```bash
git add .
git commit -m "feat: unify server with main project"
git push origin main
```

2. **Conectar ao Vercel:**
   - Vá para https://vercel.com/new
   - Selecione seu repositório
   - As configurações serão detectadas automaticamente
   - Configure as variáveis de ambiente:
     - `DATABASE_URL` (seu banco PostgreSQL)
     - `JWT_SECRET` (uma chave aleatória forte)
     - `NODE_ENV=production`

3. **Deploy automático:**
   - Cada push para `main` fará deploy automático

## Estrutura de Pastas

```
estoque/
├── api/                          # Vercel Functions (APIs)
│   ├── lib/
│   │   ├── middleware/auth.ts   # Autenticação JWT
│   │   ├── prisma.ts            # Singleton Prisma
│   │   └── utils.ts             # Helpers (CORS, auth)
│   ├── auth/index.ts            # Login/Register/Me
│   ├── products/[id].ts         # CRUD de produtos
│   ├── users/[id].ts            # CRUD de usuários
│   ├── suppliers/[id].ts        # CRUD de fornecedores
│   ├── sales/index.ts           # Vendas
│   ├── stock-movements/         # Movimentos de estoque
│   ├── dashboard/stats.ts       # Estatísticas
│   ├── reports/index.ts         # Relatórios
│   ├── settings/index.ts        # Configurações
│   └── public/                  # Rotas públicas
├── src/                          # Frontend (React + Vite)
├── prisma/                       # Schema e migrações
├── dist/                         # Build output
└── package.json
```

## Migrações do Banco de Dados

Se você fizer mudanças no schema Prisma:

```bash
# Criar uma migração
npm run prisma:migrate

# Ou atualizar direto (desenvolvimento)
npm run prisma:db-push
```

## Segurança em Produção

1. ✅ Altere `JWT_SECRET` para uma chave forte e aleatória
2. ✅ Use `NODE_ENV=production` em produção
3. ✅ Configure CORS adequadamente no arquivo `api/lib/utils.ts` se necessário
4. ✅ Configure variáveis de ambiente sensíveis como secrets no Vercel

## Próximos Passos

1. Teste a aplicação localmente
2. Verifique se as APIs funcionam:
   - Faça login em `/api/auth`
   - Acesse rotas protegidas com o token JWT
3. Deploy para Vercel quando tudo estiver funcionando
4. Atualize seu frontend para apontar para as novas URLs da API

## Endpoints da API

### Autenticação (Público)
- `POST /api/auth` - Login (envie `email` e `password`)
- `POST /api/auth` - Register (envie `email`, `password`, `name`)
- `GET /api/auth` - Get current user (requer token)

### Filiais (Público)
- `GET /api/public/filiais` - Listar filiais
- `GET /api/public/check-admin` - Verificar se existe admin

### Outras rotas (Requerem autenticação)
Todas as outras rotas requerem token JWT no header:
```
Authorization: Bearer <seu_token_jwt>
```

## Notas Importantes

- A pasta `server/` do projeto antigo pode ser removida depois que você confirmar que tudo está funcionando
- As Vercel Functions são servidas em `/api/` por padrão
- O frontend continua sendo servido da pasta `src/` via Vite
- Prisma Studio está disponível apenas em desenvolvimento

## Suporte

Se encontrar problemas:
1. Verifique se o `DATABASE_URL` está correto
2. Verifique os logs no Vercel Dashboard
3. Use `npm run prisma:studio` para debugar o banco de dados
4. Verifique se as variáveis de ambiente estão configuradas

---

🎉 **Pronto para hospedar na Vercel!**
