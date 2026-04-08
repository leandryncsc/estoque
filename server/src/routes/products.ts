import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Listar produtos
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const products = await prisma.products.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(products);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Criar produto
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, sku, category, cost_price, sale_price, stock_quantity, supplier_id, filial_id } = req.body;
    
    // Convertendo para String/Decimal conforme Prisma schema (se Prisma pedir Date ou Float, o parser resolve na maioria dos casos, mas para Decimal em JS enviamos nuúmero/string).
    const newProduct = await prisma.products.create({
      data: {
        name,
        sku,
        category,
        cost_price,
        sale_price,
        stock_quantity: parseInt(stock_quantity) || 0,
        supplier_id,
        filial_id: filial_id || req.user?.filial_id
      }
    });
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar produto
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
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
        supplier_id
      }
    });
    
    res.json(updatedProduct);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Excluir produto
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    await prisma.products.delete({
      where: { id }
    });
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

export default router;
