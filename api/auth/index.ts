import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mude-em-producao';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  try {
    if (req.method === 'POST') {
      const { email, password, name, role, filial_id } = req.body;

      if (password && email && !name) {
        if (!password) {
          return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const user = await prisma.profiles.findUnique({
          where: { email },
        });

        if (!user) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, filial_id: user.filial_id },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        return res.json({
          token,
          user: { id: user.id, email: user.email, name: user.name, role: user.role, filial_id: user.filial_id },
        });
      } else if (password && email && name) {
        if (!email || !password || !name) {
          return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
        }

        const existingUser = await prisma.profiles.findUnique({ where: { email } });

        if (existingUser) {
          return res.status(400).json({ error: 'Email já está em uso' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.profiles.create({
          data: { email, password: hashedPassword, name, role: role || 'seller', filial_id: filial_id || null, user_id: crypto.randomUUID() },
        });

        return res.status(201).json({
          message: 'Usuário criado com sucesso',
          user: { id: newUser.id, email: newUser.email, name: newUser.name },
        });
      }
    } else if (req.method === 'GET') {
      return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
        try {
          const user = await prisma.profiles.findUnique({
            where: { id: authReq.user?.id },
            select: { id: true, email: true, name: true, role: true, filial_id: true },
          });

          if (!user) return authRes.status(404).json({ error: 'Usuário não encontrado' });
          authRes.json(user);
        } catch (error) {
          authRes.status(500).json({ error: 'Erro interno' });
        }
      });
    }

    res.status(404).json({ error: 'Rota não encontrada' });
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
