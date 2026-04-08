import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Listar filiais (pode ser pública ou apenas logado)
router.get('/', async (req, res) => {
  try {
    const filiais = await prisma.filiais.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(filiais);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar filiais' });
  }
});

// Criar filial
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { nome, endereco } = req.body;
    const filial = await prisma.filiais.create({
      data: { nome, endereco }
    });
    res.status(201).json(filial);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar filial' });
  }
});

// Atualizar filial
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { nome, endereco } = req.body;
    const filial = await prisma.filiais.update({
      where: { id: req.params.id as string },
      data: { nome, endereco }
    });
    res.json(filial);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar filial' });
  }
});

// Deletar filial
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await prisma.filiais.delete({
      where: { id: req.params.id as string }
    });
    res.json({ message: 'Filial deletada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar filial' });
  }
});

export default router;
