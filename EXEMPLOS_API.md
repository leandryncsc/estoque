# Exemplos de Uso das APIs

## Autenticação

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com", "password": "senha123"}'
```

Resposta:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "seu@email.com",
    "name": "Seu Nome",
    "role": "administrador",
    "filial_id": null
  }
}
```

### 2. Registrar Novo Usuário

```bash
curl -X POST http://localhost:3000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "novo@email.com",
    "password": "senha123",
    "name": "Novo Usuário",
    "role": "seller",
    "filial_id": "uuid-da-filial"
  }'
```

### 3. Obter Dados do Usuário Atual

```bash
curl -X GET http://localhost:3000/api/auth \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## Filiais (Público - Sem autenticação)

### Listar Filiais

```bash
curl -X GET http://localhost:3000/api/public/filiais
```

### Verificar se Existe Admin

```bash
curl -X GET http://localhost:3000/api/public/check-admin
```

## Produtos (Requer Autenticação)

### Listar Produtos

```bash
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Criar Produto

```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "name": "Arroz",
    "sku": "ARR001",
    "category": "Alimentos",
    "cost_price": 15.00,
    "sale_price": 25.00,
    "stock_quantity": 100,
    "supplier_id": "uuid-supplier",
    "filial_id": "uuid-filial"
  }'
```

### Atualizar Produto

```bash
curl -X PUT http://localhost:3000/api/products/PRODUTO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "name": "Arroz Premium",
    "sale_price": 30.00,
    "stock_quantity": 150
  }'
```

### Deletar Produto

```bash
curl -X DELETE http://localhost:3000/api/products/PRODUTO_ID \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## Fornecedores

### Listar Fornecedores

```bash
curl -X GET http://localhost:3000/api/suppliers \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Criar Fornecedor

```bash
curl -X POST http://localhost:3000/api/suppliers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "name": "Fornecedor X",
    "cnpj_cpf": "12.345.678/0001-99",
    "address": "Rua das Flores, 123",
    "phone": "(11) 98765-4321",
    "email": "contato@fornecedor.com"
  }'
```

## Vendas

### Listar Vendas

```bash
curl -X GET http://localhost:3000/api/sales \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Criar Venda

```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "total_amount": 150.00,
    "payment_method": "dinheiro",
    "customer_id": "uuid-customer",
    "filial_id": "uuid-filial",
    "items": [
      {
        "product_id": "uuid-product",
        "quantity": 2,
        "unit_price": 75.00
      }
    ]
  }'
```

## Movimentos de Estoque

### Listar Movimentos

```bash
curl -X GET "http://localhost:3000/api/stock-movements?type=entrada" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

Parâmetros:

- `type=entrada` - Apenas entradas
- `type=saida` - Apenas saídas
- Sem tipo - Todos os movimentos

### Registrar Movimento Manual

```bash
curl -X POST http://localhost:3000/api/stock-movements \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "product_id": "uuid-product",
    "quantity": 50,
    "movement_type": "entrada",
    "reason": "Compra fornecedor",
    "cost_price": 15.00
  }'
```

## Dashboard

### Obter Estatísticas

```bash
curl -X GET "http://localhost:3000/api/dashboard/stats?filial_id=uuid&userType=administrador" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

Parâmetros opcionais:

- `filial_id` - Filtrar por filial
- `userType` - Tipo de usuário
- `lowStockLimit` - Limite de estoque baixo (padrão: 8)

Resposta:

```json
{
  "productsCount": 150,
  "suppliersCount": 25,
  "lowStockCount": 5,
  "salesTodayCount": 12,
  "salesTodayAmount": 1250.50,
  "recentSales": [...]
}
```

## Relatórios

### Gerar Relatórios

```bash
curl -X GET "http://localhost:3000/api/reports?startDate=2024-01-01&endDate=2024-01-31&filial_id=uuid" \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

Parâmetros:

- `startDate` - Data inicial (ISO 8601)
- `endDate` - Data final (ISO 8601)
- `filial_id` - Filtrar por filial
- `userType` - Tipo de usuário

## Configurações

### Obter Configurações

```bash
curl -X GET http://localhost:3000/api/settings \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Atualizar Configurações

```bash
curl -X PUT http://localhost:3000/api/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "companyName": "Meu Supermercado",
    "companyEmail": "contato@supermercado.com",
    "companyPhone": "(11) 98765-4321",
    "companyAddress": "Rua Principal, 100",
    "lowStockAlert": 10,
    "enableNotifications": true,
    "enableEmailAlerts": false,
    "enableLowStockAlerts": true,
    "autoBackup": true,
    "darkMode": false,
    "compactView": false
  }'
```

## Usuários

### Listar Usuários

```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Criar Usuário Admin

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "name": "Admin Novo",
    "email": "admin@novo.com",
    "password": "senha123"
  }'
```

### Atualizar Usuário

```bash
curl -X PUT http://localhost:3000/api/users/USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{
    "name": "Novo Nome",
    "role": "seller",
    "filial_id": "uuid-filial",
    "new_email": "novo@email.com",
    "new_password": "nova_senha"
  }'
```

### Deletar Usuário

```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## Headers Importantes

Todas as requisições autenticadas precisam do header:

```
Authorization: Bearer <seu_token_jwt>
```

## Erros Comuns

### 401 - Token não fornecido

Adicione o header `Authorization: Bearer SEU_TOKEN`

### 403 - Token inválido

O token expirou ou é inválido. Faça login novamente.

### 400 - Dados inválidos

Verifique se todos os campos obrigatórios foram enviados.

### 500 - Erro interno

Verifique o log da aplicação e o console.

## Testando com JavaScript/Fetch

```javascript
// Login
const loginResponse = await fetch("http://localhost:3000/api/auth", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "seu@email.com",
    password: "senha123",
  }),
});

const { token } = await loginResponse.json();

// Usar token em requisições
const response = await fetch("http://localhost:3000/api/products", {
  headers: { Authorization: `Bearer ${token}` },
});

const products = await response.json();
console.log(products);
```

## Testando com Postman

1. Importe o arquivo `postman_collection.json` (se disponível)
2. Ou configure manualmente:
   - **Base URL**: `http://localhost:3000`
   - **Auth Type**: Bearer Token
   - **Token**: `{{token}}` (salve em variável após login)
