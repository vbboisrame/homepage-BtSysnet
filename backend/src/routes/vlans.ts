import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { Vlan, VlanService } from '../types';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

async function attachServices(vlans: Vlan[]): Promise<Vlan[]> {
  if (vlans.length === 0) return [];
  const ids = vlans.map(v => v.id);
  const [services] = await pool.query(
    'SELECT * FROM vlan_services WHERE vlan_id IN (?) ORDER BY vlan_id, id',
    [ids]
  ) as [VlanService[], any];
  return vlans.map(v => ({ ...v, services: services.filter(s => s.vlan_id === v.id) }));
}

// ── GET /api/vlans ─────────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [vlans] = await pool.query(
      'SELECT v.*, s.name AS site_name, s.code AS site_code FROM vlans v JOIN sites s ON v.site_id = s.id ORDER BY s.id, v.number'
    ) as [Vlan[], any];
    res.json(await attachServices(vlans));
  } catch (err) {
    console.error('Erreur GET /vlans :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/vlans/site/:siteId ────────────────────────────────────────────

router.get('/site/:siteId', async (req: Request, res: Response) => {
  try {
    const [vlans] = await pool.query(
      'SELECT v.*, s.name AS site_name FROM vlans v JOIN sites s ON v.site_id = s.id WHERE v.site_id = ? ORDER BY v.number',
      [req.params.siteId]
    ) as [Vlan[], any];
    res.json(await attachServices(vlans));
  } catch (err) {
    console.error('Erreur GET /vlans/site/:siteId :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/vlans ────────────────────────────────────────────────────────

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { number, name, ip_range, gateway, type, mtu, site_id } = req.body as Partial<Vlan>;

  if (!number || !name || !ip_range || !gateway || !site_id) {
    res.status(400).json({ error: 'number, name, ip_range, gateway et site_id sont obligatoires' });
    return;
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO vlans (number, name, ip_range, gateway, type, mtu, site_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [number, name, ip_range, gateway, type ?? 'local', mtu ?? 1500, site_id]
    ) as [any, any];

    const [rows] = await pool.query('SELECT * FROM vlans WHERE id = ?', [result.insertId]) as [Vlan[], any];
    res.status(201).json({ ...rows[0], services: [] });
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: `VLAN ${number} existe déjà sur ce site` });
    } else {
      console.error('Erreur POST /vlans :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

// ── PUT /api/vlans/:id ─────────────────────────────────────────────────────

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { number, name, ip_range, gateway, type, mtu } = req.body as Partial<Vlan>;

  if (!number || !name || !ip_range || !gateway) {
    res.status(400).json({ error: 'number, name, ip_range et gateway sont obligatoires' });
    return;
  }

  try {
    const [check] = await pool.query('SELECT id FROM vlans WHERE id = ?', [req.params.id]) as [any[], any];
    if (check.length === 0) return res.status(404).json({ error: 'VLAN non trouvé' });

    await pool.query(
      'UPDATE vlans SET number = ?, name = ?, ip_range = ?, gateway = ?, type = ?, mtu = ? WHERE id = ?',
      [number, name, ip_range, gateway, type ?? 'local', mtu ?? 1500, req.params.id]
    );

    const [rows] = await pool.query('SELECT * FROM vlans WHERE id = ?', [req.params.id]) as [Vlan[], any];
    res.json((await attachServices(rows))[0]);
  } catch (err) {
    console.error('Erreur PUT /vlans/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── DELETE /api/vlans/:id ──────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const conn = await (pool as any).getConnection();
  try {
    const [check] = await conn.query('SELECT id FROM vlans WHERE id = ?', [req.params.id]) as [any[], any];
    if (check.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'VLAN non trouvé' });
    }

    await conn.beginTransaction();
    await conn.query('DELETE FROM vlan_services WHERE vlan_id = ?', [req.params.id]);
    await conn.query('DELETE FROM device_vlans WHERE vlan_id = ?', [req.params.id]);
    await conn.query('DELETE FROM vlans WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.status(204).send();
  } catch (err) {
    await conn.rollback();
    console.error('Erreur DELETE /vlans/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

export default router;
