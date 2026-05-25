import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const suppliers = await prisma.suppliers.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(suppliers);
  } catch (error) {
    console.error('Erro ao processar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao processar fornecedores' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, cnpj_cpf, address, phone, email } = req.body;

    const newSupplier = await prisma.suppliers.create({
      data: { name, cnpj_cpf, address, phone, email },
    });

    res.status(201).json(newSupplier);
  } catch (error) {
    console.error('Erro ao processar fornecedores:', error);
    res.status(500).json({ error: 'Erro ao processar fornecedores' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, cnpj_cpf, address, phone, email } = req.body;

    const updatedSupplier = await prisma.suppliers.update({
      where: { id },
      data: { name, cnpj_cpf, address, phone, email },
    });

    res.json(updatedSupplier);
  } catch (error) {
    console.error('Erro ao processar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao processar fornecedor' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.suppliers.delete({
      where: { id },
    });
    res.json({ message: 'Fornecedor deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar fornecedor:', error);
    res.status(500).json({ error: 'Erro ao processar fornecedor' });
  }
});

export default router;
