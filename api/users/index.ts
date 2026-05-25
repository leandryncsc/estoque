import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import prisma from '../../lib/prisma';
import { withCors, withAuth } from '../../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const users = await prisma.profiles.findMany({
          orderBy: { name: 'asc' }
        });

        const filiaisIds = [...new Set(users.map((u: any) => u.filial_id).filter(Boolean))];
        const filiais = await prisma.filiais.findMany({
          where: { id: { in: filiaisIds as string[] } }
        });

        const filialMap: any = {};
        filiais.forEach((f: any) => filialMap[f.id] = f.nome);

        const enrichedUsers = users.map((u: any) => ({
          ...u,
          filiais: u.filial_id ? { nome: filialMap[u.filial_id] } : null
        }));

        return authRes.json(enrichedUsers);
      } else if (req.method === 'POST') {
        const { name, email, password } = req.body;

        const existing = await prisma.profiles.findUnique({ where: { email } });
        if (existing) {
          return authRes.status(400).json({ error: 'Email já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const userRole = 'administrador';

        const newUser = await prisma.profiles.create({
          data: {
            email,
            password: hashedPassword,
            name,
            role: userRole,
            user_id: require('crypto').randomUUID()
          }
        });

        return authRes.status(201).json(newUser);
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar usuários:', error);
      authRes.status(500).json({ error: 'Erro ao processar usuários' });
    }
  });
}
