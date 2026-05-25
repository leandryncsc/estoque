import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const filiais = await prisma.filiais.findMany({ orderBy: { nome: 'asc' } });
        return authRes.json(filiais);
      } else if (req.method === 'POST') {
        const { nome, endereco } = req.body;
        const filial = await prisma.filiais.create({ data: { nome, endereco } });
        return authRes.status(201).json(filial);
      } else if (req.method === 'PUT') {
        const id = authReq.query?.id as string;
        const { nome, endereco } = req.body;
        const filial = await prisma.filiais.update({ where: { id }, data: { nome, endereco } });
        return authRes.json(filial);
      } else if (req.method === 'DELETE') {
        const id = authReq.query?.id as string;
        await prisma.filiais.delete({ where: { id } });
        return authRes.json({ message: 'Filial deletada' });
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar filiais:', error);
      authRes.status(500).json({ error: 'Erro ao processar filiais' });
    }
  });
}

