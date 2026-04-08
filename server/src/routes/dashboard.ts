import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { filial_id, userType } = req.query;
    
    // Configurações (ex: limite de estoque baixo) vindo do query ou padrão
    const lowStockLimit = Number(req.query.lowStockLimit) || 8;

    // Construção de where condition baseado na filial
    const filialCondition: any = {};
    if (userType !== 'administrador' || filial_id) {
      if (filial_id && filial_id !== 'all') {
         filialCondition['filial_id'] = filial_id;
      }
    }

    // Suppliers geralmente não tem filial_id, ou se tem, depende do schema. 
    // Olhando o prisma schema, suppliers NÃO TEM filial_id.
    const suppliersCount = await prisma.suppliers.count();

    const productsCount = await prisma.products.count({
      where: filialCondition
    });

    const lowStockCount = await prisma.products.count({
      where: {
        ...filialCondition,
        stock_quantity: { lte: lowStockLimit }
      }
    });

    // Datas para vendas
    const now = new Date();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const salesToday = await prisma.sales.findMany({
      where: {
        ...filialCondition,
        created_at: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: { total_amount: true }
    });

    const salesTodayCount = salesToday.length;
    const salesTodayAmount = salesToday.reduce((acc, sale) => acc + Number(sale.total_amount), 0);

    const recentSalesResult = await prisma.sales.findMany({
      where: {
        ...filialCondition,
        created_at: {
          gte: sevenDaysAgo,
          lte: now
        }
      },
      select: { id: true, total_amount: true, created_at: true },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    res.json({
      productsCount,
      suppliersCount,
      lowStockCount,
      salesTodayCount,
      salesTodayAmount,
      recentSales: recentSalesResult
    });
  } catch (error) {
    console.error('Erro ao buscar stats do dashboard:', error);
    res.status(500).json({ error: 'Erro ao buscar stats do dashboard' });
  }
});

export default router;
