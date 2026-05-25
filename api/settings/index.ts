import { VercelRequest, VercelResponse } from '@vercel/node';
import prisma from '../../lib/prisma';
import { withCors, withAuth } from '../../lib/utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (withCors(req, res)) return;

  return withAuth(req, res, async (authReq: any, authRes: VercelResponse) => {
    try {
      if (req.method === 'GET') {
        const settings = await prisma.$queryRaw`SELECT * FROM system_settings WHERE id = '1'`;

        if (Array.isArray(settings) && settings.length > 0) {
          return authRes.json(settings[0]);
        } else {
          return authRes.json({
            companyName: "Supermercado",
            companyEmail: "admin@supermercado.com",
            companyPhone: "",
            companyAddress: "",
            lowStockAlert: 10,
            enableNotifications: true,
            enableEmailAlerts: false,
            enableLowStockAlerts: true,
            autoBackup: true,
            darkMode: false,
            compactView: false
          });
        }
      } else if (req.method === 'PUT') {
        const {
          companyName,
          companyEmail,
          companyPhone,
          companyAddress,
          lowStockAlert,
          enableNotifications,
          enableEmailAlerts,
          enableLowStockAlerts,
          autoBackup,
          darkMode,
          compactView
        } = req.body;

        const existing = await prisma.$queryRaw`SELECT id FROM system_settings WHERE id = '1'`;

        if (Array.isArray(existing) && existing.length > 0) {
          await prisma.$executeRaw`
            UPDATE system_settings
            SET 
              "companyName" = ${companyName},
              "companyEmail" = ${companyEmail},
              "companyPhone" = ${companyPhone},
              "companyAddress" = ${companyAddress},
              "lowStockAlert" = ${Number(lowStockAlert)},
              "enableNotifications" = ${Boolean(enableNotifications)},
              "enableEmailAlerts" = ${Boolean(enableEmailAlerts)},
              "enableLowStockAlerts" = ${Boolean(enableLowStockAlerts)},
              "autoBackup" = ${Boolean(autoBackup)},
              "darkMode" = ${Boolean(darkMode)},
              "compactView" = ${Boolean(compactView)},
              "updated_at" = NOW()
            WHERE id = '1'
          `;
        } else {
          await prisma.$executeRaw`
            INSERT INTO system_settings (
              id, 
              "companyName", 
              "companyEmail", 
              "companyPhone", 
              "companyAddress", 
              "lowStockAlert", 
              "enableNotifications", 
              "enableEmailAlerts", 
              "enableLowStockAlerts", 
              "autoBackup", 
              "darkMode", 
              "compactView",
              "updated_at"
            ) VALUES (
              '1',
              ${companyName},
              ${companyEmail},
              ${companyPhone},
              ${companyAddress},
              ${Number(lowStockAlert)},
              ${Boolean(enableNotifications)},
              ${Boolean(enableEmailAlerts)},
              ${Boolean(enableLowStockAlerts)},
              ${Boolean(autoBackup)},
              ${Boolean(darkMode)},
              ${Boolean(compactView)},
              NOW()
            )
          `;
        }

        return authRes.json({ success: true });
      }

      authRes.status(404).json({ error: 'Método não suportado' });
    } catch (error) {
      console.error('Erro ao processar configurações:', error);
      authRes.status(500).json({ error: 'Erro ao processar configurações' });
    }
  });
}
