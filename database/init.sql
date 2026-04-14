-- ============================================================
--  PROXIMA INFRA — Base de données
--  Généré depuis proxima_network_diagram.html
-- ============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ── Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sites (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  code       VARCHAR(10)  NOT NULL UNIQUE,  -- LIR, EVR, NS
  name       VARCHAR(100) NOT NULL,          -- Liré, Évrunes...
  location   VARCHAR(100),
  status     ENUM('active','placeholder') DEFAULT 'active',
  wg_ip      VARCHAR(20),                   -- IP WireGuard du routeur
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS devices (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  hostname    VARCHAR(60)  NOT NULL UNIQUE,
  type        ENUM('router','switch','server','nas','pbs','ha','gns','ap','placeholder') NOT NULL,
  model       VARCHAR(150),
  specs       VARCHAR(500),
  link_type   ENUM('fiber','sfp','rj45','rj45-4x') DEFAULT 'rj45',
  services    TEXT,
  site_id     INT NOT NULL,
  parent_id   INT DEFAULT NULL,   -- pour les VMs (parent = hyperviseur)
  status      ENUM('active','planned','placeholder') DEFAULT 'active',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id)   REFERENCES sites(id),
  FOREIGN KEY (parent_id) REFERENCES devices(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vlans (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  number      SMALLINT    NOT NULL,
  name        VARCHAR(60) NOT NULL,
  ip_range    VARCHAR(20) NOT NULL,
  gateway     VARCHAR(20) NOT NULL,
  type        ENUM('intersite','local','isolated') DEFAULT 'local',
  mtu         SMALLINT DEFAULT 1500,
  site_id     INT NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (site_id) REFERENCES sites(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS vlan_services (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  vlan_id  INT NOT NULL,
  name     VARCHAR(80) NOT NULL,
  icon     VARCHAR(10),
  color    VARCHAR(20),
  FOREIGN KEY (vlan_id) REFERENCES vlans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS device_vlans (
  device_id INT NOT NULL,
  vlan_id   INT NOT NULL,
  PRIMARY KEY (device_id, vlan_id),
  FOREIGN KEY (device_id) REFERENCES devices(id),
  FOREIGN KEY (vlan_id)   REFERENCES vlans(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Données : Sites ─────────────────────────────────────────

INSERT INTO sites (code, name, location, status, wg_ip) VALUES
  ('LIR', 'Liré',           'Maine-et-Loire (49)', 'active',      '10.0.0.1'),
  ('EVR', 'Évrunes',        'Maine-et-Loire (49)', 'active',      '10.0.0.2'),
  ('NS',  'Nantes Saverne', 'Loire-Atlantique (44)','placeholder', NULL);

-- ── Données : Équipements Liré ───────────────────────────────

INSERT INTO devices (hostname, type, model, specs, link_type, services, site_id, parent_id, status) VALUES
(
  'LIR-RTR-001', 'router',
  'MikroTik RB4011iGS+5HacQ2HnD',
  'RouterOS · 10/100/1000 × 10 · SFP+ 10G · Wi-Fi 5ac dual-band',
  'fiber',
  'WireGuard · NAT · Firewall',
  1, NULL, 'active'
),
(
  'LIR-SW-001', 'switch',
  'MikroTik CRS354-48P-4S+2Q+RM',
  '48× RJ45 PoE · 4× SFP+ 10G · 2× QSFP+ 40G',
  'fiber',
  'Switch cœur · trunk all VLANs',
  1, NULL, 'active'
),
(
  'LIR-AP-001', 'ap',
  'MikroTik cAP ax',
  'Wi-Fi 6 · PoE in',
  'rj45',
  'SSID HOME → VLAN 50 · SSID IOT → VLAN 40 · Mgmt VLAN 10',
  1, NULL, 'active'
),
(
  'LIR-AP-002', 'ap',
  'MikroTik cAP ax',
  'Wi-Fi 6 · PoE in',
  'rj45',
  'SSID HOME → VLAN 50 · SSID IOT → VLAN 40 · Mgmt VLAN 10',
  1, NULL, 'active'
),
(
  'LIR-AP-003', 'ap',
  'MikroTik cAP ax',
  'Wi-Fi 6 · PoE in',
  'rj45',
  'SSID HOME → VLAN 50 · SSID IOT → VLAN 40 · Mgmt VLAN 10',
  1, NULL, 'active'
),
(
  'LIR-PXMPVE-001', 'server',
  'HP · 2 CPU · 16c/32t · 128 Go RAM',
  '2× CPU · 16 cœurs/32 threads · 128 Go RAM · SSD NVMe',
  'rj45-4x',
  'Proxmox VE · héberge toutes les VMs',
  1, NULL, 'active'
),
(
  'LIR-TRUENAS-001', 'nas',
  'TrueNAS Scale (VM Proxmox)',
  'VM Proxmox · ZFS · iSCSI target · Jumbo frames',
  'rj45',
  'TrueNAS · iSCSI target · Jumbo frames',
  1, NULL, 'active'  -- parent_id sera mis à jour après
),
(
  'LIR-PXMPBS-001', 'pbs',
  'Raspberry Pi 4B+',
  '4 Go RAM · SSD USB · Proxmox Backup Server',
  'rj45',
  'Proxmox Backup Server (PBS)',
  1, NULL, 'active'
),
(
  'LIR-HAOS-001', 'ha',
  'VM Proxmox (HAOS)',
  'Home Assistant OS · VM dédiée',
  'rj45',
  'Home Assistant OS · Frigate',
  1, NULL, 'active'
),
(
  'LIR-DEBDOCK-001', 'server',
  'Debian 12 (VM Proxmox)',
  '4 vCPU · 8 Go RAM',
  'rj45',
  'Portainer · Nginx Proxy Manager · Scanopy Daemon · Homarr · it-tools',
  1, NULL, 'active'
),
(
  'LIR-DEBDOCK-002', 'server',
  'Debian 12 (VM Proxmox)',
  '4 vCPU · 8 Go RAM',
  'rj45',
  'Guacamole · Portainer Agent · Scanopy Daemon',
  1, NULL, 'active'
),
(
  'LIR-DEBDOCK-003', 'server',
  'Debian 12 (VM Proxmox)',
  '4 vCPU · 8 Go RAM',
  'rj45',
  'Netbox · Portainer Agent · Scanopy Server · Scanopy Daemon',
  1, NULL, 'active'
),
(
  'LIR-DEBAUTH-001', 'server',
  'Debian 12 (VM Proxmox)',
  '4 vCPU · 8 Go RAM',
  'rj45',
  'Authentik · Portainer Agent · Scanopy Daemon',
  1, NULL, 'active'
),
(
  'LIR-DEBGNS-001', 'gns',
  'Debian 12 (VM Proxmox)',
  '8 vCPU · 16 Go RAM',
  'rj45',
  'GNS3 · émulation réseau',
  1, NULL, 'active'
);

-- ── Données : Équipements Évrunes ───────────────────────────

INSERT INTO devices (hostname, type, model, specs, link_type, services, site_id, parent_id, status) VALUES
(
  'EVR-RTR-001', 'router',
  'MikroTik RB5009UG+S+IN',
  'RouterOS · 8× RJ45 · SFP+ 10G',
  'rj45',
  'WireGuard · NAT · Firewall',
  2, NULL, 'active'
),
(
  'EVR-SW-001', 'switch',
  'MikroTik CSS326-24G-2S+RM',
  '24× RJ45 1G · 2× SFP+ 10G',
  'rj45',
  'Switch cœur · trunk all VLANs',
  2, NULL, 'active'
),
(
  'EVR-AP-001', 'ap',
  'À définir · PoE',
  NULL,
  'rj45',
  'À venir · même config que Liré',
  2, NULL, 'planned'
),
(
  'EVR-AP-002', 'ap',
  'À définir · PoE',
  NULL,
  'rj45',
  'À venir · même config que Liré',
  2, NULL, 'planned'
),
(
  'EVR-AP-003', 'ap',
  'À définir · PoE',
  NULL,
  'rj45',
  'À venir · même config que Liré',
  2, NULL, 'planned'
),
(
  'EVR-DEBDSK-001', 'server',
  'Debian 13 KDE (VM Proxmox)',
  'Jump VM · KDE Plasma · RDP via Guacamole',
  'rj45',
  'KDE Plasma · RDP · Jump host',
  2, NULL, 'active'
);

-- ── Mise à jour des parent_id (VMs Proxmox) ─────────────────

UPDATE devices SET parent_id = (SELECT id FROM (SELECT id FROM devices WHERE hostname = 'LIR-PXMPVE-001') t)
WHERE hostname IN (
  'LIR-TRUENAS-001','LIR-HAOS-001',
  'LIR-DEBDOCK-001','LIR-DEBDOCK-002','LIR-DEBDOCK-003',
  'LIR-DEBAUTH-001','LIR-DEBGNS-001'
);

-- ── Données : VLANs Liré ─────────────────────────────────────

INSERT INTO vlans (number, name, ip_range, gateway, type, mtu, site_id) VALUES
(10, 'Serveurs',   '10.1.10.0/24', '10.1.10.254', 'intersite', 1500, 1),
(20, 'Stockage',   '10.1.20.0/24', '10.1.20.254', 'local',     9000, 1),
(30, 'Backup',     '10.1.30.0/24', '10.1.30.254', 'local',     1500, 1),
(40, 'Domotique',  '10.1.40.0/24', '10.1.40.254', 'local',     1500, 1),
(50, 'Domestique', '10.1.50.0/24', '10.1.50.254', 'local',     1500, 1),
(60, 'LAB',        '10.1.60.0/24', '10.1.60.254', 'isolated',  1500, 1);

-- ── Données : VLANs Évrunes ──────────────────────────────────

INSERT INTO vlans (number, name, ip_range, gateway, type, mtu, site_id) VALUES
(10, 'Serveurs',   '10.2.10.0/24', '10.2.10.254', 'intersite', 1500, 2),
(20, 'Stockage',   '10.2.20.0/24', '10.2.20.254', 'local',     9000, 2),
(30, 'Backup',     '10.2.30.0/24', '10.2.30.254', 'local',     1500, 2),
(40, 'Domotique',  '10.2.40.0/24', '10.2.40.254', 'local',     1500, 2),
(50, 'Domestique', '10.2.50.0/24', '10.2.50.254', 'local',     1500, 2),
(60, 'LAB',        '10.2.60.0/24', '10.2.60.254', 'isolated',  1500, 2);

-- ── Services par VLAN (Liré) ─────────────────────────────────

INSERT INTO vlan_services (vlan_id, name, icon, color) VALUES
-- VLAN 10 Liré
(1, 'Authentik',   'A', '#7c3aed'),
(1, 'Docker (×3)', 'D', '#2496ed'),
(1, 'Guacamole',   'G', '#3daa4a'),
(1, 'Homarr',      'H', '#f97316'),
(1, 'Scanopy',     'S', '#7c3aed'),
-- VLAN 20 Liré
(2, 'TrueNAS (VM)', 'T', '#0095d5'),
(2, 'iSCSI target', 'i', '#0095d5'),
-- VLAN 30 Liré
(3, 'PBS (RPi 4B+)', 'P', '#e57000'),
-- VLAN 40 Liré
(4, 'Home Assistant', 'H', '#18bcf2'),
(4, 'Frigate',        'F', '#1a3a5c'),
-- VLAN 50 Liré
(5, 'Imprimante réseau', '🖨', '#0f6e56'),
(5, 'TV · Apple TV · PC','📱', '#1a1a1a'),
(5, 'HomePod · Téléphones','🎵','#1a1a1a'),
-- VLAN 60 Liré
(6, 'GNS3', 'G', '#e8333a');

-- ── Services par VLAN (Évrunes) ──────────────────────────────

INSERT INTO vlan_services (vlan_id, name, icon, color) VALUES
-- VLAN 10 Évrunes
(7,  'EVR-AP-001', 'S', '#38bdf8'),
-- VLAN 20 Évrunes
(8,  'TrueNAS (VM)', 'T', '#0095d5'),
(8,  'iSCSI target', 'i', '#0095d5'),
-- VLAN 30 Évrunes
(9,  'Veeam', 'V', '#00b336'),
-- VLAN 40 Évrunes
(10, 'Home Assistant', 'H', '#18bcf2'),
(10, 'Frigate',        'F', '#1a3a5c'),
-- VLAN 50 Évrunes
(11, 'Imprimante réseau',  '🖨', '#0f6e56'),
(11, 'TV · PC',           '📱', '#1a1a1a'),
(11, 'HomePod · Téléphones','🎵','#1a1a1a');
-- VLAN 60 Évrunes : vide pour l'instant
