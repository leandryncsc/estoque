import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from '../backend/routes/auth';
import productsRoutes from '../backend/routes/products';
import suppliersRoutes from '../backend/routes/suppliers';
import salesRoutes from '../backend/routes/sales';
import stockMovementsRoutes from '../backend/routes/stock-movements';
import dashboardRoutes from '../backend/routes/dashboard';
import filiaisRoutes from '../backend/routes/filiais';
import usersRoutes from '../backend/routes/users';
import reportsRoutes from '../backend/routes/reports';
import settingsRoutes from '../backend/routes/settings';
import publicRoutes from '../backend/routes/public';

const app = express();

app.use(cors());
app.use(express.json());

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
app.use('/api/public', publicRoutes);

export default app;
