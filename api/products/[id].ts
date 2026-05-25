import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  const { id } = req.query;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'PUT') {
        const { name, sku, category, cost_price, sale_price, stock_quantity, supplier_id } = req.body;

        const updatedProduct = await prisma.products.update({
          where: { id: id as string },
          data: {
            name,
            sku,
            category,
            cost_price,
            sale_price,
            stock_quantity: parseInt(stock_quantity),
            supplier_id
          }
        });

        return authRes.json(updatedProduct);
      } else if (req.method === 'DELETE') {
        await prisma.products.delete({
          where: { id: id as string }
        });
        return authRes.json({ message: 'Produto deletado com sucesso' });
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar produto:', error);
      authRes.status(500).json({ error: 'Erro ao processar produto' });
    }
  });
}
