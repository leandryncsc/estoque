import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  const { id } = req.query;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'PUT') {
        const { nome, endereco } = req.body;
        const filial = await prisma.filiais.update({
          where: { id: id as string },
          data: { nome, endereco }
        });
        return authRes.json(filial);
      } else if (req.method === 'DELETE') {
        await prisma.filiais.delete({
          where: { id: id as string }
        });
        return authRes.json({ message: 'Filial deletada' });
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar filial:', error);
      authRes.status(500).json({ error: 'Erro ao processar filial' });
    }
  });
}
