import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Listar fornecedores
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const suppliers = await prisma.suppliers.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao buscar fornecedores' });
  }
});

// Criar fornecedor
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, cnpj_cpf, address, phone, email } = req.body;
    
    const newSupplier = await prisma.suppliers.create({
      data: {
        name,
        cnpj_cpf,
        address,
        phone,
        email
      }
    });
    
    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao criar fornecedor' });
  }
});

// Atualizar fornecedor
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { name, cnpj_cpf, address, phone, email } = req.body;
    
    const updatedSupplier = await prisma.suppliers.update({
      where: { id },
      data: {
        name,
        cnpj_cpf,
        address,
        phone,
        email
      }
    });
    
    res.json(updatedSupplier);
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao atualizar fornecedor' });
  }
});

// Excluir fornecedor
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    await prisma.suppliers.delete({
      where: { id }
    });
    res.json({ message: 'Fornecedor deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao deletar fornecedor' });
  }
});

export default router;
