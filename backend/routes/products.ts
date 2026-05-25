import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const products = await prisma.products.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (error) {
    console.error('Erro ao processar produtos:', error);
    res.status(500).json({ error: 'Erro ao processar produtos' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
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
        filial_id: filial_id || req.user?.filial_id,
      },
    });

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Erro ao processar produtos:', error);
    res.status(500).json({ error: 'Erro ao processar produtos' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, sku, category, cost_price, sale_price, stock_quantity, supplier_id } = req.body;

    const updatedProduct = await prisma.products.update({
      where: { id },
      data: {
        name,
        sku,
        category,
        cost_price,
        sale_price,
        stock_quantity: parseInt(stock_quantity),
        supplier_id,
      },
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Erro ao processar produto:', error);
    res.status(500).json({ error: 'Erro ao processar produto' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.products.delete({
      where: { id },
    });
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar produto:', error);
    res.status(500).json({ error: 'Erro ao processar produto' });
  }
});

export default router;
