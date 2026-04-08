import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// Listar todos os usuarios
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.profiles.findMany({
      orderBy: { name: 'asc' }
    });
    
    // Anexar filiais no retorno
    const filiaisIds = [...new Set(users.map(u => u.filial_id).filter(Boolean))];
    const filiais = await prisma.filiais.findMany({
      where: { id: { in: filiaisIds as string[] } }
    });
    
    const filialMap: any = {};
    filiais.forEach(f => filialMap[f.id] = f.nome);
    
    const enrichedUsers = users.map(u => ({
      ...u,
      filiais: u.filial_id ? { nome: filialMap[u.filial_id] } : null
    }));
    
    res.json(enrichedUsers);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Criar usuario admin
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
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
        user_id: crypto.randomUUID() // Generates random ID since we aren't using Supabase auth ID anymore
      }
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Atualizar usuario
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;
    const { name, role, filial_id, new_email, new_password } = req.body;
    
    let updateData: any = { name, role, filial_id };
    
    if (new_email) updateData.email = new_email;
    if (new_password) updateData.password = await bcrypt.hash(new_password, 10);
    
    const user = await prisma.profiles.update({
      where: { id },
      data: updateData
    });
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuario
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user_id = req.params.id as string;
    await prisma.profiles.deleteMany({
      where: { user_id }
    });
    res.json({ message: 'Usuário deletado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

export default router;
