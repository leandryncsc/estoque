import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const filiais = await prisma.filiais.findMany({
      orderBy: { nome: 'asc' },
    });
    res.json(filiais);
  } catch (error) {
    console.error('Erro ao processar filiais:', error);
    res.status(500).json({ error: 'Erro ao processar filiais' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { nome, endereco } = req.body;
    const filial = await prisma.filiais.create({
      data: { nome, endereco },
    });
    res.status(201).json(filial);
  } catch (error) {
    console.error('Erro ao processar filiais:', error);
    res.status(500).json({ error: 'Erro ao processar filiais' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, endereco } = req.body;
    const filial = await prisma.filiais.update({
      where: { id },
      data: { nome, endereco },
    });
    res.json(filial);
  } catch (error) {
    console.error('Erro ao processar filial:', error);
    res.status(500).json({ error: 'Erro ao processar filial' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.filiais.delete({
      where: { id },
    });
    res.json({ message: 'Filial deletada' });
  } catch (error) {
    console.error('Erro ao processar filial:', error);
    res.status(500).json({ error: 'Erro ao processar filial' });
  }
});

export default router;
