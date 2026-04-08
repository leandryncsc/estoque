import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Buscar configurações
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Usando $queryRaw para evitar problemas temporários de tipagem caso o prisma generate falhe devido ao lock
    const settings = await prisma.$queryRaw`SELECT * FROM system_settings WHERE id = '1'`;
    
    if (Array.isArray(settings) && settings.length > 0) {
      res.json(settings[0]);
    } else {
      // Se não houver configurações, retornamos valores padrões
      res.json({
        companyName: "StockPro",
        companyEmail: "admin@stockpro.com",
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
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    res.status(500).json({ error: 'Erro ao buscar configurações' });
  }
});

// Atualizar configurações
router.put('/', authenticateToken, async (req, res) => {
  try {
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

    let result;
    if (Array.isArray(existing) && existing.length > 0) {
      // Atualizar
      result = await prisma.$executeRaw`
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
      // Inserir
      result = await prisma.$executeRaw`
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
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    res.status(500).json({ error: 'Erro ao atualizar configurações' });
  }
});

export default router;
