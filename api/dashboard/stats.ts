import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const { filial_id, userType } = req.query;
        const lowStockLimit = Number(req.query.lowStockLimit) || 8;

        const filialCondition: any = {};
        if (userType !== 'administrador' || filial_id) {
          if (filial_id && filial_id !== 'all') {
            filialCondition['filial_id'] = filial_id;
          }
        }

        const suppliersCount = await prisma.suppliers.count();
        const productsCount = await prisma.products.count({ where: filialCondition });
        const lowStockCount = await prisma.products.count({
          where: { ...filialCondition, stock_quantity: { lte: lowStockLimit } },
        });

        const now = new Date();
        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const salesToday = await prisma.sales.findMany({
          where: { ...filialCondition, created_at: { gte: startOfDay, lte: endOfDay } },
          select: { total_amount: true },
        });

        const salesTodayCount = salesToday.length;
        const salesTodayAmount = salesToday.reduce((acc: number, sale: any) => acc + Number(sale.total_amount), 0);

        const recentSalesResult = await prisma.sales.findMany({
          where: { ...filialCondition, created_at: { gte: sevenDaysAgo, lte: now } },
          select: { id: true, total_amount: true, created_at: true },
          orderBy: { created_at: 'desc' },
          take: 5,
        });

        return authRes.json({ productsCount, suppliersCount, lowStockCount, salesTodayCount, salesTodayAmount, recentSales: recentSalesResult });
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao buscar stats do dashboard:', error);
      authRes.status(500).json({ error: 'Erro ao buscar stats do dashboard' });
    }
  });
}
