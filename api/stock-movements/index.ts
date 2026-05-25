import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const { type } = req.query;

        let whereClause: any = {};
        if (type) {
          whereClause.movement_type = String(type);
        }

        const movements = await prisma.stock_movements.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' }
        });

        const productIds = [...new Set(movements.map((m: any) => m.product_id))];
        const products = await prisma.products.findMany({
          where: { id: { in: productIds } },
          select: { id: true, name: true, sku: true, sale_price: true }
        });

        const productMap: any = {};
        products.forEach((p: any) => productMap[p.id] = p);

        const enrichedMovements = movements.map((m: any) => ({
          ...m,
          products: productMap[m.product_id] || { name: 'Desconhecido', sku: '' }
        }));

        return authRes.json(enrichedMovements);
      } else if (req.method === 'POST') {
        const { product_id, quantity, cost_price, reason, movement_type } = req.body;
        const user_id = authReq.user?.id;
        if (!user_id) return authRes.status(401).json({ error: 'Não autorizado' });

        const numQuantity = Number(quantity);

        const result = await prisma.$transaction(async (tx) => {
          const movement = await tx.stock_movements.create({
            data: {
              product_id,
              quantity: numQuantity,
              cost_price: cost_price ? Number(cost_price) : null,
              reason,
              movement_type,
              user_id
            }
          });

          await tx.products.update({
            where: { id: product_id },
            data: {
              stock_quantity: movement_type === 'entrada' ? { increment: numQuantity } : { decrement: numQuantity }
            }
          });

          return movement;
        });

        return authRes.status(201).json(result);
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error: any) {
      console.error('Erro ao processar movimento de estoque:', error);
      authRes.status(500).json({ error: error.message || 'Erro ao processar movimento' });
    }
  });
}
