import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { Site } from '../types';

const router = Router();

// GET /api/sites — retourne tous les sites
router.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sites ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error('Erreur GET /sites :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sites/:id — retourne un site par son ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sites WHERE id = ?',
      [req.params.id]
    ) as [Site[], any];

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Site non trouvé' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur GET /sites/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
