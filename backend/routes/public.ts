import { Router, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/filiais', async (req, res: Response) => {
  try {
    const filiais = await prisma.filiais.findMany({
      orderBy: { nome: 'asc' },
    });
    res.json(filiais);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar filiais' });
  }
});

router.get('/check-admin', async (req, res: Response) => {
  try {
    const adminCount = await prisma.profiles.count({
      where: { role: 'administrador' },
    });
    res.json(adminCount > 0);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar admins' });
  }
});

export default router;
