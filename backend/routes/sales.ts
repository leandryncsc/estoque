import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const sales = await prisma.sales.findMany({
      orderBy: { created_at: 'desc' },
    });
    res.json(sales);
  } catch (error) {
    console.error('Erro ao processar vendas:', error);
    res.status(500).json({ error: 'Erro ao processar vendas' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { total_amount, payment_method, customer_id, filial_id, items } = req.body;
    const user_id = req.user?.id;

    if (!user_id) return res.status(401).json({ error: 'Não autorizado' });
    if (!items || items.length === 0) return res.status(400).json({ error: 'Carrinho vazio' });

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sales.create({
        data: {
          total_amount,
          payment_method,
          customer_id,
          user_id,
          filial_id,
        },
      });

      for (const item of items) {
        await tx.sale_items.create({
          data: {
            sale_id: sale.id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
            filial_id,
          },
        });

        await tx.stock_movements.create({
          data: {
            product_id: item.product_id,
            movement_type: 'saida',
            quantity: item.quantity,
            reason: `Venda - ID: ${sale.id}`,
            user_id,
            filial_id,
          },
        });

        await tx.products.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity,
            },
          },
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
