import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const { config } = await import('dotenv');
config({ path: '.env.local' });

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', (await import('./routes/auth')).default);
app.use('/api/products', (await import('./routes/products')).default);
app.use('/api/suppliers', (await import('./routes/suppliers')).default);
app.use('/api/sales', (await import('./routes/sales')).default);
app.use('/api/stock-movements', (await import('./routes/stock-movements')).default);
app.use('/api/dashboard', (await import('./routes/dashboard')).default);
app.use('/api/filiais', (await import('./routes/filiais')).default);
app.use('/api/users', (await import('./routes/users')).default);
app.use('/api/reports', (await import('./routes/reports')).default);
app.use('/api/settings', (await import('./routes/settings')).default);
app.use('/api/public', (await import('./routes/public')).default);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
