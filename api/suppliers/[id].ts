import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  const { id } = req.query;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'PUT') {
        const { name, cnpj_cpf, address, phone, email } = req.body;

        const updatedSupplier = await prisma.suppliers.update({
          where: { id: id as string },
          data: {
            name,
            cnpj_cpf,
            address,
            phone,
            email
          }
        });

        return authRes.json(updatedSupplier);
      } else if (req.method === 'DELETE') {
        await prisma.suppliers.delete({
          where: { id: id as string }
        });
        return authRes.json({ message: 'Fornecedor deletado com sucesso' });
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar fornecedor:', error);
      authRes.status(500).json({ error: 'Erro ao processar fornecedor' });
    }
  });
}
