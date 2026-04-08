import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Listar vendas (opcional, para relatórios se necessário)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const sales = await prisma.sales.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(sales);
  } catch (error) {
    console.error('Erro ao listar vendas:', error);
    res.status(500).json({ error: 'Erro ao buscar vendas' });
  }
});

// Criar venda (processar PDV)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { total_amount, payment_method, customer_id, filial_id, items } = req.body;
    const user_id = req.user?.id; // pego do JWT AuthRequest

    if (!user_id) return res.status(401).json({ error: 'Não autorizado' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });

    // O Prisma recomenda usar a transação iterando $transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar a venda
      const sale = await tx.sales.create({
        data: {
          total_amount,
          payment_method,
          customer_id,
          user_id,
          filial_id
        }
      });

      // 2. Criar os itens, movimentos de estoque e atualizar saldos
      for (const item of items) {
        // Criar sale_item
        await tx.sale_items.create({
          data: {
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            filial_id
          }
        });

        // Criar movimento de estoque (saída)
        await tx.stock_movements.create({
          data: {
            product_id: item.product_id,
            movement_type: 'saida',
            quantity: item.quantity,
            reason: `Venda - ID: ${sale.id}`,
            user_id,
            filial_id
          }
        });

        // Atualizar saldo do produto (diminuir estoque)
        await tx.products.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      return sale;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Erro ao processar venda:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar venda' });
  }
});

export default router;
