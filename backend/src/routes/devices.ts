import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { Device } from '../types';
import { requireAuth } from '../middleware/auth';

const router = Router();

// ── Helpers ────────────────────────────────────────────────────────────────

const DEVICE_SELECT = `
  SELECT
    d.*,
    s.name  AS site_name,
    s.code  AS site_code,
    GROUP_CONCAT(DISTINCT v.number ORDER BY v.number SEPARATOR ',') AS vlan_list
  FROM devices d
  JOIN sites s ON d.site_id = s.id
  LEFT JOIN device_vlans dv ON dv.device_id = d.id
  LEFT JOIN vlans v ON v.id = dv.vlan_id
`;

function parseVlans(rows: any[]): Device[] {
  return rows.map(row => {
    const { vlan_list, ...rest } = row;
    return { ...rest, vlans: vlan_list ? vlan_list.split(',').map(Number) : [] };
  });
}

// ── GET /api/devices ───────────────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      DEVICE_SELECT + ' GROUP BY d.id ORDER BY s.id, d.type, d.hostname'
    ) as [any[], any];
    res.json(parseVlans(rows));
  } catch (err) {
    console.error('Erreur GET /devices :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/devices/site/:siteId ──────────────────────────────────────────

router.get('/site/:siteId', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      DEVICE_SELECT + ' WHERE d.site_id = ? GROUP BY d.id ORDER BY d.parent_id ASC, d.hostname ASC',
      [req.params.siteId]
    ) as [any[], any];

    const devices: Device[] = parseVlans(rows);
    const map: Record<number, Device> = {};
    for (const d of devices) map[d.id] = { ...d, children: [] };
    const roots: Device[] = [];
    for (const d of devices) {
      if (d.parent_id && map[d.parent_id]) map[d.parent_id].children!.push(map[d.id]);
      else roots.push(map[d.id]);
    }
    res.json(roots);
  } catch (err) {
    console.error('Erreur GET /devices/site/:siteId :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── GET /api/devices/:id ───────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      DEVICE_SELECT + ' WHERE d.id = ? GROUP BY d.id',
      [req.params.id]
    ) as [any[], any];
    if (rows.length === 0) return res.status(404).json({ error: 'Équipement non trouvé' });
    res.json(parseVlans(rows)[0]);
  } catch (err) {
    console.error('Erreur GET /devices/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ── POST /api/devices ──────────────────────────────────────────────────────

router.post('/', requireAuth, async (req: Request, res: Response) => {
  const { hostname, type, model, specs, link_type, services, site_id, parent_id, status } =
    req.body as Partial<Device>;

  if (!hostname || !type || !site_id) {
    res.status(400).json({ error: 'hostname, type et site_id sont obligatoires' });
    return;
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO devices (hostname, type, model, specs, link_type, services, site_id, parent_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [hostname, type, model ?? null, specs ?? null, link_type ?? 'rj45',
       services ?? null, site_id, parent_id ?? null, status ?? 'active']
    ) as [any, any];

    const [rows] = await pool.query(
      DEVICE_SELECT + ' WHERE d.id = ? GROUP BY d.id', [result.insertId]
    ) as [any[], any];
    res.status(201).json(parseVlans(rows)[0]);
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: `L'hostname "${hostname}" existe déjà` });
    } else {
      console.error('Erreur POST /devices :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

// ── PUT /api/devices/:id ───────────────────────────────────────────────────

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { hostname, type, model, specs, link_type, services, parent_id, status } =
    req.body as Partial<Device>;

  if (!hostname || !type) {
    res.status(400).json({ error: 'hostname et type sont obligatoires' });
    return;
  }

  try {
    const [check] = await pool.query('SELECT id FROM devices WHERE id = ?', [req.params.id]) as [any[], any];
    if (check.length === 0) return res.status(404).json({ error: 'Équipement non trouvé' });

    await pool.query(
      `UPDATE devices SET hostname = ?, type = ?, model = ?, specs = ?,
       link_type = ?, services = ?, parent_id = ?, status = ? WHERE id = ?`,
      [hostname, type, model ?? null, specs ?? null, link_type ?? 'rj45',
       services ?? null, parent_id ?? null, status ?? 'active', req.params.id]
    );

    const [rows] = await pool.query(
      DEVICE_SELECT + ' WHERE d.id = ? GROUP BY d.id', [req.params.id]
    ) as [any[], any];
    res.json(parseVlans(rows)[0]);
  } catch (err: any) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: `L'hostname "${hostname}" est déjà utilisé` });
    } else {
      console.error('Erreur PUT /devices/:id :', err);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

// ── DELETE /api/devices/:id ────────────────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const conn = await (pool as any).getConnection();
  try {
    const [check] = await conn.query('SELECT id FROM devices WHERE id = ?', [req.params.id]) as [any[], any];
    if (check.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Équipement non trouvé' });
    }

    await conn.beginTransaction();
    // Supprimer les enfants (VMs) et leurs associations
    const [children] = await conn.query('SELECT id FROM devices WHERE parent_id = ?', [req.params.id]) as [any[], any];
    for (const child of children) {
      await conn.query('DELETE FROM device_vlans WHERE device_id = ?', [child.id]);
    }
    await conn.query('DELETE FROM devices WHERE parent_id = ?', [req.params.id]);
    // Supprimer les associations VLAN du parent
    await conn.query('DELETE FROM device_vlans WHERE device_id = ?', [req.params.id]);
    // Supprimer l'équipement
    await conn.query('DELETE FROM devices WHERE id = ?', [req.params.id]);
    await conn.commit();
    res.status(204).send();
  } catch (err) {
    await conn.rollback();
    console.error('Erreur DELETE /devices/:id :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    conn.release();
  }
});

export default router;
