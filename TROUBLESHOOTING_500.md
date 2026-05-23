# 🔍 TROUBLESHOOTING - ERRO 500 NO LOGIN

## ✅ PASSO 1: Verificar Status do Banco

Acesse no seu navegador:
```
https://estoque-eight-omega.vercel.app/api/debug/db-status
```

Você deve ver algo como:
```json
{
  "status": "connected",
  "database": "PostgreSQL",
  "tables": 12,
  "users": 1,
  "filiais": 1,
  "hasAdminUser": true
}
```

**Se retornar erro:**
- ❌ DATABASE_URL não está configurada corretamente
- ❌ Banco não é acessível publicamente
- ❌ Credenciais estão erradas

---

## ✅ PASSO 2: Inicializar Banco de Dados

### Opção A: Localmente (Recomendado para primeira vez)

```bash
# 1. Configure DATABASE_URL localmente em um arquivo .env
# DATABASE_URL="postgresql://user:password@localhost:5432/estoque"

# 2. Rode as migrations
npm run db:push

# 3. Inicialize com dados de teste
npm run db:init

# 4. Teste localmente
npm run dev:all
# Tente logar com: admin@admin.com / admin123

# 5. Se funcionar, faça deploy
git push origin main
```

### Opção B: No Vercel (usando console)

1. Vá para: https://vercel.com/[seu-projeto]/logs
2. Abra um terminal (se disponível) ou veja os logs
3. Execute via API (criar script automático):

```bash
# Ou configure um webhook que rode ao deploy
```

---

## 🔧 COMANDOS ÚTEIS

```bash
# Ver logs em tempo real do Vercel
vercel logs [seu-projeto] --follow

# Verificar migrations
npx prisma migrate status --schema=server/prisma/schema.prisma

# Resetar banco (⚠️ PERDA DE DADOS!)
npx prisma migrate reset --schema=server/prisma/schema.prisma

# Verificar schema do Prisma
npx prisma studio --schema=server/prisma/schema.prisma
```

---

## ❌ ERROS COMUNS

### "relation 'profiles' does not exist"
**Solução:** Migrations não foram rodadas
```bash
npm run db:push
npm run db:init
```

### "too many connections"
**Solução:** Reinicie as funções serverless no Vercel
```bash
vercel env rm DATABASE_URL
vercel env add DATABASE_URL [sua-url]
```

### "ECONNREFUSED"
**Solução:** Banco não é acessível de internet
- Verifique firewall do banco
- Adicione IP 0.0.0.0/0 ao whitelist (ou IPs do Vercel)

---

## 📊 PRÓXIMOS PASSOS

1. **Teste /api/debug/db-status** para confirmar conexão
2. **Se conectado mas sem dados**, execute `npm run db:init`
3. **Se error ao conectar**, revise DATABASE_URL no Vercel
4. **Redeploy** após mudanças

---

## 💡 DICA: Usuário de Teste Padrão

Após `npm run db:init`:
- **Email:** admin@admin.com
- **Senha:** admin123
- **Papel:** Administrador

**⚠️ Mude a senha em produção!**

---

## 🆘 AINDA NÃO FUNCIONA?

1. Verifique os logs: `vercel logs estoque-eight-omega`
2. Confirme DATABASE_URL está em `Production and Preview`
3. Teste conexão manualmente com seu cliente PostgreSQL
4. Contate o suporte do seu provedor de banco de dados

