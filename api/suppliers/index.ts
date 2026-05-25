import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';
import { withCors, withAuth } from '../../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const suppliers = await prisma.suppliers.findMany({
          orderBy: { name: 'asc' }
        });
        return authRes.json(suppliers);
      } else if (req.method === 'POST') {
        const { name, cnpj_cpf, address, phone, email } = req.body;

        const newSupplier = await prisma.suppliers.create({
          data: {
            name,
            cnpj_cpf,
            address,
            phone,
            email
          }
        });

        return authRes.status(201).json(newSupplier);
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar fornecedores:', error);
      authRes.status(500).json({ error: 'Erro ao processar fornecedores' });
    }
  });
}
