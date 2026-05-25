import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
let loaded = false;

export default async (req: any, res: any) => {
  if (!loaded) {
    app.use(cors());
    app.use(express.json());

    app.use('/api/auth', (await import('../backend/routes/auth')).default);
    app.use('/api/products', (await import('../backend/routes/products')).default);
    app.use('/api/suppliers', (await import('../backend/routes/suppliers')).default);
    app.use('/api/sales', (await import('../backend/routes/sales')).default);
    app.use('/api/stock-movements', (await import('../backend/routes/stock-movements')).default);
    app.use('/api/dashboard', (await import('../backend/routes/dashboard')).default);
    app.use('/api/filiais', (await import('../backend/routes/filiais')).default);
    app.use('/api/users', (await import('../backend/routes/users')).default);
    app.use('/api/reports', (await import('../backend/routes/reports')).default);
    app.use('/api/settings', (await import('../backend/routes/settings')).default);
    app.use('/api/public', (await import('../backend/routes/public')).default);

    loaded = true;
  }
  return app(req, res);
};
