import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';
import { withCors } from '../../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  try {
    const filiais = await prisma.filiais.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(filiais);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar filiais' });
  }
}
