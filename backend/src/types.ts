// ── Types qui reflètent exactement les tables SQL ──

export interface Site {
  id: number;
  code: string;
  name: string;
  location: string | null;
  status: 'active' | 'placeholder';
  wg_ip: string | null;
}

export interface Device {
  id: number;
  hostname: string;
  type: 'router' | 'switch' | 'server' | 'nas' | 'pbs' | 'ha' | 'gns' | 'ap' | 'placeholder';
  model: string | null;
  specs: string | null;
  link_type: 'fiber' | 'sfp' | 'rj45' | 'rj45-4x';
  services: string | null;
  site_id: number;
  parent_id: number | null;
  status: 'active' | 'planned' | 'placeholder';
  // Champs joints (optionnels, présents si on fait un JOIN)
  site_name?: string;
  site_code?: string;
  vlans?: number[];      // numéros de VLAN associés à cet équipement
  children?: Device[];   // VMs hébergées sur cet équipement
}

export interface Vlan {
  id: number;
  number: number;
  name: string;
  ip_range: string;
  gateway: string;
  type: 'intersite' | 'local' | 'isolated';
  mtu: number;
  site_id: number;
  site_name?: string;
  services?: VlanService[];
}

export interface VlanService {
  id: number;
  vlan_id: number;
  name: string;
  icon: string | null;
  color: string | null;
}
