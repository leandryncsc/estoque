import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../lib/prisma.js';
import { withCors, withAuth } from '../lib/utils.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  const { id } = req.query;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'PUT') {
        const { name, role, filial_id, new_email, new_password } = req.body;
        const bcrypt = await import('bcryptjs');

        let updateData: any = { name, role, filial_id };

        if (new_email) updateData.email = new_email;
        if (new_password) updateData.password = await bcrypt.default.hash(new_password, 10);

        const user = await prisma.profiles.update({
          where: { id: id as string },
          data: updateData
        });

        return authRes.json(user);
      } else if (req.method === 'DELETE') {
        const user_id = id as string;
        await prisma.profiles.deleteMany({
          where: { user_id }
        });
        return authRes.json({ message: 'Usuário deletado' });
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar usuário:', error);
      authRes.status(500).json({ error: 'Erro ao processar usuário' });
    }
  });
}
