import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const sales = await prisma.sales.findMany({
          orderBy: { created_at: 'desc' }
        });
        return authRes.json(sales);
      } else if (req.method === 'POST') {
        const { total_amount, payment_method, customer_id, filial_id, items } = req.body;
        const user_id = authReq.user?.id;

        if (!user_id) return authRes.status(401).json({ error: 'Não autorizado' });
        if (!items || items.length === 0) return authRes.status(400).json({ error: 'Carrinho vazio' });

        const result = await prisma.$transaction(async (tx) => {
          const sale = await tx.sales.create({
            data: {
              total_amount,
              payment_method,
              customer_id,
              user_id,
              filial_id
            }
          });

          for (const item of items) {
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

        return authRes.status(201).json(result);
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error: any) {
      console.error('Erro ao processar venda:', error);
      authRes.status(500).json({ error: error.message || 'Erro ao processar venda' });
    }
  });
}
