import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const products = await prisma.products.findMany({
          orderBy: { name: 'asc' }
        });
        return authRes.json(products);
      } else if (req.method === 'POST') {
        const { name, sku, category, cost_price, sale_price, stock_quantity, supplier_id, filial_id } = req.body;

        const newProduct = await prisma.products.create({
          data: {
            name,
            sku,
            category,
            cost_price,
            sale_price,
            stock_quantity: parseInt(stock_quantity) || 0,
            supplier_id,
            filial_id: filial_id || authReq.user?.filial_id
          }
        });

        return authRes.status(201).json(newProduct);
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar produtos:', error);
      authRes.status(500).json({ error: 'Erro ao processar produtos' });
    }
  });
}
