import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';
import { withCors, withAuth } from '../../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const filiais = await prisma.filiais.findMany({
          orderBy: { nome: 'asc' }
        });
        return authRes.json(filiais);
      } else if (req.method === 'POST') {
        const { nome, endereco } = req.body;
        const filial = await prisma.filiais.create({
          data: { nome, endereco }
        });
        return authRes.status(201).json(filial);
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar filiais:', error);
      authRes.status(500).json({ error: 'Erro ao processar filiais' });
    }
  });
}
