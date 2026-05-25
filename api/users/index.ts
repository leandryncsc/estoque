import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const users = await prisma.profiles.findMany({ orderBy: { name: 'asc' } });

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

        return authRes.json(enrichedUsers);
      } else if (req.method === 'POST') {
        const { name, email, password } = req.body;

        const existing = await prisma.profiles.findUnique({ where: { email } });
        if (existing) {
          return authRes.status(400).json({ error: 'Email já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await prisma.profiles.create({
          data: { email, password: hashedPassword, name, role: 'administrador', user_id: crypto.randomUUID() },
        });

        return authRes.status(201).json(newUser);
      } else if (req.method === 'PUT') {
        const id = authReq.query?.id as string;
        const { name, role, filial_id, new_email, new_password } = req.body;

        let updateData: any = { name, role, filial_id };
        if (new_email) updateData.email = new_email;
        if (new_password) updateData.password = await bcrypt.hash(new_password, 10);

        const user = await prisma.profiles.update({ where: { id }, data: updateData });
        return authRes.json(user);
      } else if (req.method === 'DELETE') {
        const id = authReq.query?.id as string;
        await prisma.profiles.deleteMany({ where: { user_id: id } });
        return authRes.json({ message: 'Usuário deletado' });
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar usuários:', error);
      authRes.status(500).json({ error: 'Erro ao processar usuários' });
    }
  });
}

