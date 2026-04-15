import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Non authentifié' });
    return;
  }
  const token = header.slice(7);
  try {
    jwt.verify(token, process.env.JWT_SECRET || 'btsysnet-secret-change-me');
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré' });
  }
}
