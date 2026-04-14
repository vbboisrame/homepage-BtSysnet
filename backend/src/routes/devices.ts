import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { Device } from '../types';

const router = Router();

// GET /api/devices — tous les équipements avec leur site
router.get('/', async (req: Request, res: Response) => {
  try {
    // On fait un JOIN pour avoir aussi le nom du site dans la réponse
    const [rows] = await pool.query(`
      SELECT
        d.*,
        s.name  AS site_name,
        s.code  AS site_code
      FROM devices d
      JOIN sites s ON d.site_id = s.id
      ORDER BY s.id, d.type, d.hostname
    `);
    res.json(rows);
  } catch (err) {
    console.error('Erreur GET /devices :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/devices/site/:siteId — équipements d'un site
// Retourne une structure arborescente : équipements racine + leurs VMs enfants
router.get('/site/:siteId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        d.*,
        s.name AS site_name,
        s.code AS site_code
      FROM devices d
      JOIN sites s ON d.site_id = s.id
      WHERE d.site_id = ?
      ORDER BY d.parent_id ASC, d.hostname ASC
    `, [req.params.siteId]) as [Device[], any];

    // On construit l'arbre : équipements racine + leurs enfants
    const roots: Device[] = [];
    const map: Record<number, Device> = {};

    for (const device of rows) {
      map[device.id] = { ...device, children: [] };
    }
    for (const device of rows) {
      if (device.parent_id && map[device.parent_id]) {
        map[device.parent_id].children!.push(map[device.id]);
      } else {
        roots.push(map[device.id]);
      }
    }

    res.json(roots);
  } catch (err) {
    console.error('Erreur GET /devices/site/:siteId :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/devices/:id — un équipement précis
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, s.name AS site_name, s.code AS site_code
      FROM devices d
      JOIN sites s ON d.site_id = s.id
      WHERE d.id = ?
    `, [req.params.id]) as [Device[], any];

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Équipement non trouvé' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Erreur GET /devices/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
