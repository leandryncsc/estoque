import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query;

    let whereClause: any = {};
    if (type) {
      whereClause.movement_type = String(type);
    }

    const movements = await prisma.stock_movements.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    const productIds = [...new Set(movements.map((m: any) => m.product_id))];
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, sale_price: true },
    });

    const productMap: any = {};
    products.forEach((p: any) => productMap[p.id] = p);

    const enrichedMovements = movements.map((m: any) => ({
      ...m,
      products: productMap[m.product_id] || { name: 'Desconhecido', sku: '' },
    }));

    res.json(enrichedMovements);
  } catch (error: any) {
    console.error('Erro ao processar movimento de estoque:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar movimento' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { product_id, quantity, cost_price, reason, movement_type } = req.body;
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: 'Não autorizado' });

    const numQuantity = Number(quantity);

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stock_movements.create({
        data: {
          product_id,
          quantity: numQuantity,
          cost_price: cost_price ? Number(cost_price) : null,
          reason,
          movement_type,
          user_id,
        },
      });

      await tx.products.update({
        where: { id: product_id },
        data: {
          stock_quantity: movement_type === 'entrada' ? { increment: numQuantity } : { decrement: numQuantity },
        },
      });

      return movement;
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Erro ao processar movimento de estoque:', error);
    res.status(500).json({ error: error.message || 'Erro ao processar movimento' });
  }
});

export default router;
