import { VercelResponse } from '@vercel/node';

export const withAuth = async (req: any, res: VercelResponse, handler: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && (authHeader as string).split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-mude-em-producao';
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return handler(req, res);
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
};

export const withCors = (req: any, res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
};
