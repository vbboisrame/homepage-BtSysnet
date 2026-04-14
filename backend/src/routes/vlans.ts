import { Router, Request, Response } from 'express';
import pool from '../db/pool';
import { Vlan, VlanService } from '../types';

const router = Router();

// GET /api/vlans — tous les VLANs avec leurs services
router.get('/', async (req: Request, res: Response) => {
  try {
    // 1. On récupère tous les VLANs avec le nom du site
    const [vlans] = await pool.query(`
      SELECT v.*, s.name AS site_name, s.code AS site_code
      FROM vlans v
      JOIN sites s ON v.site_id = s.id
      ORDER BY s.id, v.number
    `) as [Vlan[], any];

    // 2. On récupère tous les services VLAN
    const [services] = await pool.query(
      'SELECT * FROM vlan_services ORDER BY vlan_id, id'
    ) as [VlanService[], any];

    // 3. On associe les services à chaque VLAN
    const result = vlans.map(vlan => ({
      ...vlan,
      services: services.filter(s => s.vlan_id === vlan.id)
    }));

    res.json(result);
  } catch (err) {
    console.error('Erreur GET /vlans :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/vlans/site/:siteId — VLANs d'un site
router.get('/site/:siteId', async (req: Request, res: Response) => {
  try {
    const [vlans] = await pool.query(`
      SELECT v.*, s.name AS site_name
      FROM vlans v
      JOIN sites s ON v.site_id = s.id
      WHERE v.site_id = ?
      ORDER BY v.number
    `, [req.params.siteId]) as [Vlan[], any];

    const vlanIds = vlans.map(v => v.id);
    if (vlanIds.length === 0) {
      return res.json([]);
    }

    const [services] = await pool.query(
      `SELECT * FROM vlan_services WHERE vlan_id IN (?) ORDER BY vlan_id, id`,
      [vlanIds]
    ) as [VlanService[], any];

    const result = vlans.map(vlan => ({
      ...vlan,
      services: services.filter(s => s.vlan_id === vlan.id)
    }));

    res.json(result);
  } catch (err) {
    console.error('Erreur GET /vlans/site/:siteId :', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
