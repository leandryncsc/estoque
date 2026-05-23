import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();

// Validar variáveis de ambiente críticas
if (!process.env.DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL não está configurada!');
}

import authRoutes from './routes/auth';

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware de tratamento de erro global
const asyncHandler = (fn: any) => (req: any, res: any, next: any) => {
  Promise.resolve(fn(req, res, next)).catch((err: any) => {
    console.error('Erro na rota:', err);
    res.status(500).json({ error: err.message || 'Erro interno do servidor' });
  });
};

import productsRoutes from './routes/products';
import suppliersRoutes from './routes/suppliers';
import salesRoutes from './routes/sales';
import stockMovementsRoutes from './routes/stock-movements';
import dashboardRoutes from './routes/dashboard';
import filiaisRoutes from './routes/filiais';
import usersRoutes from './routes/users';
import reportsRoutes from './routes/reports';
import settingsRoutes from './routes/settings';

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/stock-movements', stockMovementsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/filiais', filiaisRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/debug/db-status', async (req, res) => {
  try {
    // Testar conexão
    await prisma.$queryRaw`SELECT 1`;
    
    // Contar tabelas
    const tables = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    ` as any[];
    
    // Contar usuários
    const userCount = await prisma.profiles.count();
    
    // Contar filiais
    const filiaisCount = await prisma.filiais.count();

    res.json({
      status: 'connected',
      database: 'PostgreSQL',
      tables: parseInt(tables[0]?.count || 0),
      users: userCount,
      filiais: filiaisCount,
      hasAdminUser: userCount > 0
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      hint: 'Verifique se DATABASE_URL está configurada corretamente no Vercel'
    });
  }
});

app.get('/api/public/filiais', asyncHandler(async (req, res) => {
  const filiais = await prisma.filiais.findMany({
    orderBy: { nome: 'asc' }
  });
  res.json(filiais);
}));

app.get('/api/public/check-admin', asyncHandler(async (req, res) => {
  const adminCount = await prisma.profiles.count({
    where: { role: 'administrador' }
  });
  res.json(adminCount > 0);
}));

if (process.env.VERCEL !== '1') {
  const frontendDist = path.join(__dirname, '..', '..', 'dist');
  app.use(express.static(frontendDist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
  });
}

export default app;
