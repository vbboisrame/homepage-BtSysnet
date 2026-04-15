import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { Site } from '../types';
import { requireAuth } from '../middleware/auth';

const router = Router();

// GET /api/sites
router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sites ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error('Erreur GET /sites :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/sites/:id
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]) as [Site[], any];
    if (rows.length === 0) return res.status(404).json({ error: 'Site non trouvé' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur GET /sites/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/sites
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { code, name, location, status, wg_ip } = req.body as Partial<Site>;
  if (!code || !name) {
    res.status(400).json({ error: 'code et name sont obligatoires' });
    return;
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO sites (code, name, location, status, wg_ip) VALUES (?, ?, ?, ?, ?)',
      [code.toUpperCase(), name, location ?? null, status ?? 'active', wg_ip ?? null]
    ) as [any, any];
    const [rows] = await pool.query('SELECT * FROM sites WHERE id = ?', [result.insertId]) as [Site[], any];
    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: `Le code site "${code}" existe déjà` });
    } else {
      console.error('Erreur POST /sites :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

// PUT /api/sites/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { name, location, status, wg_ip } = req.body as Partial<Site>;
  if (!name) {
    res.status(400).json({ error: 'name est obligatoire' });
    return;
  }
  try {
    const [check] = await pool.query('SELECT id FROM sites WHERE id = ?', [req.params.id]) as [any[], any];
    if (check.length === 0) return res.status(404).json({ error: 'Site non trouvé' });

    await pool.query(
      'UPDATE sites SET name = ?, location = ?, status = ?, wg_ip = ? WHERE id = ?',
      [name, location ?? null, status ?? 'active', wg_ip ?? null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM sites WHERE id = ?', [req.params.id]) as [Site[], any];
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur PUT /sites/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/sites/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const [check] = await pool.query('SELECT id FROM sites WHERE id = ?', [req.params.id]) as [any[], any];
    if (check.length === 0) return res.status(404).json({ error: 'Site non trouvé' });

    const [devices] = await pool.query('SELECT id FROM devices WHERE site_id = ?', [req.params.id]) as [any[], any];
    if (devices.length > 0) {
      res.status(409).json({ error: 'Impossible de supprimer : le site contient des équipements' });
      return;
    }
    const [vlans] = await pool.query('SELECT id FROM vlans WHERE site_id = ?', [req.params.id]) as [any[], any];
    if (vlans.length > 0) {
      res.status(409).json({ error: 'Impossible de supprimer : le site contient des VLANs' });
      return;
    }

    await pool.query('DELETE FROM sites WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erreur DELETE /sites/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
