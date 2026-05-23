import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mude-em-producao';

// Rota de login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    console.log(`[AUTH] Tentativa de login com email: ${email}`);

    const user = await prisma.profiles.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`[AUTH] Usuário não encontrado: ${email}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`[AUTH] Senha inválida para: ${email}`);
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        filial_id: user.filial_id 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log(`[AUTH] Login bem-sucedido para: ${email}`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        filial_id: user.filial_id
      }
    });
  } catch (error) {
    console.error('[AUTH] Erro no login:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Registrar (se quiser permitir registro aberto ou por admin)
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role, filial_id } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    const existingUser = await prisma.profiles.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já está em uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.profiles.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'seller',
        filial_id: filial_id || null,
        user_id: crypto.randomUUID() // Fallback unique ID since we don't have supabase auth anymore
      },
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// Obter usuário logado atual
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.profiles.findUnique({
      where: { id: req.user?.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        filial_id: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
