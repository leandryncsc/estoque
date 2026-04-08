import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

import authRoutes from './routes/auth';

app.use(cors());
app.use(express.json());

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

// Rotas públicas auxiliares (para o login/cadastro)
app.get('/api/public/filiais', async (req, res) => {
  try {
    const filiais = await prisma.filiais.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(filiais);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar filiais' });
  }
});

app.get('/api/public/check-admin', async (req, res) => {
  try {
    const adminCount = await prisma.profiles.count({
      where: { role: 'administrador' }
    });
    res.json(adminCount > 0);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar admins' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
