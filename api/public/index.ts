import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  try {
    if (req.method === 'GET') {
      if (req.url?.includes('check-admin')) {
        const adminCount = await prisma.profiles.count({
          where: { role: 'administrador' },
        });
        return res.json(adminCount > 0);
      }

      const filiais = await prisma.filiais.findMany({
        orderBy: { nome: 'asc' },
      });
      return res.json(filiais);
    }

    res.status(404).json({ error: 'Rota não encontrada' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}
