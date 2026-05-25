import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma.js';
import { withCors } from '../../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  try {
    const adminCount = await prisma.profiles.count({
      where: { role: 'administrador' }
    });
    res.json(adminCount > 0);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar admins' });
  }
}
