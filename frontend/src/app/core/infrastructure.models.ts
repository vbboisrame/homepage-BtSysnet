// Ces interfaces décrivent exactement ce que l'API renvoie.
// TypeScript s'en sert pour vérifier que tu utilises les bonnes
// propriétés dans tes composants (autocomplétion + erreurs au build).

export interface Site {
  id: number;
  code: string;       // 'LIR', 'EVR', 'NS'
  name: string;       // 'Liré', 'Évrunes'
  location: string | null;
  status: 'active' | 'placeholder';
  wg_ip: string | null;
}

export type DeviceType =
  | 'router' | 'switch' | 'server' | 'nas'
  | 'pbs' | 'ha' | 'gns' | 'ap' | 'placeholder';

export type LinkType = 'fiber' | 'sfp' | 'rj45' | 'rj45-4x';

export interface Device {
  id: number;
  hostname: string;
  type: DeviceType;
  model: string | null;
  specs: string | null;
  link_type: LinkType;
  services: string | null;
  site_id: number;
  parent_id: number | null;
  status: 'active' | 'planned' | 'placeholder';
  site_name?: string;
  site_code?: string;
  vlans?: number[];      // numéros de VLAN associés à cet équipement
  children?: Device[];   // VMs hébergées sur cet équipement
}

export type VlanType = 'intersite' | 'local' | 'isolated';

export interface VlanService {
  id: number;
  vlan_id: number;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface Vlan {
  id: number;
  number: number;       // 10, 20, 30...
  name: string;         // 'Serveurs', 'Stockage'...
  ip_range: string;     // '10.1.10.0/24'
  gateway: string;      // '10.1.10.254'
  type: VlanType;
  mtu: number;          // 1500 ou 9000
  site_id: number;
  site_name?: string;
  services?: VlanService[];
}

// Structure complète d'un site pour le diagramme
export interface SiteDiagram {
  site: Site;
  devices: Device[];
  vlans: Vlan[];
}
