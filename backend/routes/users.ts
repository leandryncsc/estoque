import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.profiles.findMany({
      orderBy: { name: 'asc' },
    });

    const filiaisIds = [...new Set(users.map((u: any) => u.filial_id).filter(Boolean))];
    const filiais = await prisma.filiais.findMany({
      where: { id: { in: filiaisIds as string[] } },
    });

    const filialMap: any = {};
    filiais.forEach((f: any) => filialMap[f.id] = f.nome);

    const enrichedUsers = users.map((u: any) => ({
      ...u,
      filiais: u.filial_id ? { nome: filialMap[u.filial_id] } : null,
    }));

    res.json(enrichedUsers);
  } catch (error) {
    console.error('Erro ao processar usuários:', error);
    res.status(500).json({ error: 'Erro ao processar usuários' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.profiles.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email já cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = 'administrador';

    const newUser = await prisma.profiles.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole,
        user_id: crypto.randomUUID(),
      },
    });

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Erro ao processar usuários:', error);
    res.status(500).json({ error: 'Erro ao processar usuários' });
  }
});

router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, filial_id, new_email, new_password } = req.body;

    let updateData: any = { name, role, filial_id };

    if (new_email) updateData.email = new_email;
    if (new_password) updateData.password = await bcrypt.hash(new_password, 10);

    const user = await prisma.profiles.update({
      where: { id },
      data: updateData,
    });

    res.json(user);
  } catch (error) {
    console.error('Erro ao processar usuário:', error);
    res.status(500).json({ error: 'Erro ao processar usuário' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.profiles.deleteMany({
      where: { user_id: id },
    });
    res.json({ message: 'Usuário deletado' });
  } catch (error) {
    console.error('Erro ao processar usuário:', error);
    res.status(500).json({ error: 'Erro ao processar usuário' });
  }
});

export default router;
