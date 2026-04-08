# Sistema de Controle de Estoque e Frente de Caixa (POS)

Um sistema completo, eficiente e moderno para gerenciamento de estoque e ponto de venda (Frente de Caixa), projetado para facilitar o controle e a operação de pequenos e médios estabelecimentos. Ele auxilia na rotina das vendas e tomadas de decisões em tempo real por meio de um fluxo dinâmico: guiando desde o cadastro de fornecedores e produtos até a emissão limpa do recibo não fiscal para o cliente.

## 🚀 Funcionalidades do Sistema

O sistema é dividido em diversos módulos interativos, intuitivos e modernos. Seguem as principais funcionalidades oferecidas:

### 1. 🔐 Autenticação e Segurança
- Controle de acesso seguro, protegendo páginas de administração.
- Sistema de login com validação.

### 2. 📊 Painel de Controle (Dashboard)
- Visão geral rápida do negócio.
- Resumo visual de indicadores vitais: produtos cadastrados, saúde do estoque, movimentações recentes e faturamento.

### 3. 📦 Gestão de Produtos
- Cadastro organizado com informações detalhadas: Nome, código, preço de custo, preço de venda e quantidade atual.
- Identificação de produtos críticos e alertas.
- Precificação correta, tratamento e visualização fluída dos valores no frontend.

### 4. 🏢 Gestão de Fornecedores
- Cadastro e rastreio de fornecedores do comércio.
- Integração que permite saber quem forneceu quais suprimentos na reposição do estoque.

### 5. 🔄 Movimentações de Estoque (Entradas e Saídas)
- **Entradas:** Formulários avançados para o registro e reposição de lote de produtos recém-comprados.
- **Saídas:** Interface de ajustes para registro de remoção e gestão de prateleira avulsa que foge do balcão de vendas.
- Gestão e histórico preciso de cada alteração de estoque (Rastreio visual das movimentações).

### 6. 🛒 Frente de Caixa Inteligente (MiniPOS)
O módulo mestre feito para acelerar a finalização e atendimento no caixa.
- **Interface Otimizada de Vendas:** Rápida inclusão de produtos ao carrinho.
- **Financeiro Automatizado:** Cálculo em tempo real do Subtotal, Total, registro de descontos e formas de pagamento (Espécie, Cartões, Pix).
- **Cálculo de Troco Instantâneo:** Mostra dinamicamente na tela o troco para o cliente.
- **Sistema de Impressão Profissional (Cupom Não Fiscal):**
  - **Flexibilidade de Papel:** Compatibilidade inteligente para impressão em Papel (A4) comum ou em Impressoras Térmicas de Bobina (ex: 80mm), configurável nas Definições.
  - **Recibos Dinâmicos e Limpos:** Nome da loja, telefone, endereço, cabeçalho transacional e itens comprados (limpo de elementos de interface interativa da tela do PC no momento da via de impressão). 

### 7. ⚙️ Configurações do Estabelecimento
- **Central da Empresa:** Tela gerenciável para input e customização dos Dados da Empresa (Nome da loja, Endereço e Contato). Esses dados são aplicados e renderizados imediatamente na nota fiscal no momento da finalização (POS).
- Gestão de preferências do terminal atual.

### 8. 📈 Emissão de Relatórios 
- Compilação dos dados históricos das vendas, fechamento de balanço e logs de produtos, permitindo consultas avançadas.

---

## 🛠️ Tecnologias e Stack Utilizada

Em sua fundação, o sistema preza por reatividade, visual *premium* e alto desempenho:
- **Frontend & Interfaces:** React.js construído via Vite, utilizando TypeScript.
- **Estilização (UI):** Interfaces construídas com TailwindCSS e bibliotecas de componentes modernos (UI/UX clean, notificações em tela, dark-mode/layouts requintados).
- **Banco de Dados (Backend):** Conexão rápida e persistente integrando soluções escaláveis em nuvem (NeonDB / PostgreSQL).
- **Roteamento:** Mapeamento de rotas e segurança SPA feito via React Router.

## 🚀 Como Executar o Projeto Localmente

**1. Requisitos:**
Possuir as ferramentas NodeJS e NPM instaladas na sua máquina.

**2. Instalando as Dependências**
Você precisará instalar as dependências tanto da raiz do projeto (frontend) quanto do backend (`/server`).
```bash
# Na raiz do projeto
npm install

# Na pasta do servidor (backend)
cd server
npm install
```

**3. Configurando as Variáveis de Ambiente (Banco de Dados)**
Crie e preencha as variáveis de ambiente baseadas no `.env.example`, fornecendo as instâncias corretas do provedor de Banco de Dados (como sua string de conexão com o NeonDB).

**4. Inicialização Simultânea**
Inicie os serviços do backend e frontend em diferentes abas do terminal.
```bash
# Terminal 1 - Rode dentro do diretório /server
npm run dev

# Terminal 2 - Rode dentro da raiz principal
npm run dev
```
Após isso, acesse o painel fornecido no log de sua aplicação frontend em seu navegador.
