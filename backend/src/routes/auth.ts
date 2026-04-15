import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// POST /api/auth/login — retourne un JWT si le mot de passe est correct
router.post('/login', (req: Request, res: Response): void => {
  const { password } = req.body as { password?: string };
  const expected     = process.env.ADMIN_PASSWORD || 'admin';

  if (!password || password !== expected) {
    res.status(401).json({ error: 'Mot de passe incorrect' });
    return;
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET || 'btsysnet-secret-change-me',
    { expiresIn: '8h' }
  );

  res.json({ token });
});

export default router;
