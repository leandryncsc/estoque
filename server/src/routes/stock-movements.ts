import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Listar movimentos de estoque
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { type } = req.query; // 'entrada' ou 'saida'
    
    // Buscar movimentos manual ou todos, com join em products (usando query pura caso relações não existam, mas vamos tentar com Prisma relations, ou retornar os dados brutos e complementar se necessário)
    // Devido à falta de @relation no Prisma Schema (ex. no arquivo foi feita introspecção sem FK), precisaremos de uma abordagem diferente se a relação falhar ou fazer consultas separadas.
    
    let whereClause: any = {};
    if (type) {
      whereClause.movement_type = String(type);
    }
    
    const movements = await prisma.stock_movements.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });
    
    // Obter os IDs de produtos únicos
    const productIds = [...new Set(movements.map(m => m.product_id))];
    const products = await prisma.products.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, sale_price: true }
    });
    
    // Mapear para facilitar
    const productMap: any = {};
    products.forEach(p => productMap[p.id] = p);
    
    const enrichedMovements = movements.map(m => ({
      ...m,
      products: productMap[m.product_id] || { name: 'Desconhecido', sku: '' }
    }));
    
    res.json(enrichedMovements);
  } catch (error) {
    console.error('Erro ao listar movimentos de estoque:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentos' });
  }
});

// Registrar entrada/saída manual
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { product_id, quantity, cost_price, reason, movement_type } = req.body;
    const user_id = req.user?.id;
    if (!user_id) return res.status(401).json({ error: 'Não autorizado' });
    
    const numQuantity = Number(quantity);
    
    // Transação para adicionar movimento e atualizar estoque
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
      
      // Atualizar saldo do produto baseando no movement_type
      await tx.products.update({
        where: { id: product_id },
        data: {
          stock_quantity: movement_type === 'entrada' ? { increment: numQuantity } : { decrement: numQuantity }
        }
      });
      
      return movement;
    });
    
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Erro ao criar movimento de estoque:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar movimento' });
  }
});

export default router;
