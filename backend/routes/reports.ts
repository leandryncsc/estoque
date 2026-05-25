import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, filial_id, userType } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(0);
    const end = endDate ? new Date(endDate as string) : new Date();

    const filialCondition: any = {};
    if (userType !== 'administrador' || filial_id) {
      if (filial_id && filial_id !== 'all') {
        filialCondition['filial_id'] = filial_id;
      }
    }

    const salesDataRaw = await prisma.sales.findMany({
      where: {
        ...filialCondition,
        created_at: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        total_amount: true,
        created_at: true,
        payment_method: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const saleIds = salesDataRaw.map((s: any) => s.id);
    const saleItems = await prisma.sale_items.findMany({
      where: { sale_id: { in: saleIds } },
      select: { sale_id: true, quantity: true, unit_price: true },
    });

    const saleItemsMap: Record<string, any[]> = {};
    saleItems.forEach((item: any) => {
      if (!saleItemsMap[item.sale_id]) saleItemsMap[item.sale_id] = [];
      saleItemsMap[item.sale_id].push(item);
    });

    const salesData = salesDataRaw.map((sale: any) => ({
      ...sale,
      sale_items: saleItemsMap[sale.id] || [],
    }));

    const stockDataRaw = await prisma.stock_movements.findMany({
      where: {
        ...filialCondition,
        created_at: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const productIds = [...new Set(stockDataRaw.map((m: any) => m.product_id))];
    const stockProducts = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sale_price: true },
    });
    const productStockMap: any = {};
    stockProducts.forEach((p: any) => productStockMap[p.id] = p);

    const stockData = stockDataRaw.map((m: any) => ({
      ...m,
      products: productStockMap[m.product_id] || { name: 'Desconhecido', sale_price: 0 },
    }));

    const lowStockProducts = await prisma.products.findMany({
      where: {
        ...filialCondition,
        stock_quantity: { lt: 10 },
      },
      select: { id: true, name: true, sku: true, stock_quantity: true, category: true },
      orderBy: { stock_quantity: 'asc' },
    });

    res.json({
      salesData,
      stockData,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Erro ao gerar relatórios:', error);
    res.status(500).json({ error: 'Erro ao gerar relatórios' });
  }
});

export default router;
