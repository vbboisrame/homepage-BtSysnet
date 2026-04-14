# Architecture — Guide pour modifier le code

Ce document explique comment le projet est organisé et comment faire
les modifications les plus courantes sans avoir besoin d'aide externe.

---

## Vue d'ensemble

```
Navigateur
    │
    ▼
Nginx :8080  ──────────────────────────────► Angular (HTML/CSS/JS statique)
    │
    │  /api/*
    ▼
Express :3000
    │
    ▼
MariaDB :3306
```

Quand tu ouvres le site dans ton navigateur :
1. Nginx sert l'application Angular (fichiers statiques)
2. Angular appelle `/api/sites`, `/api/devices`, etc.
3. Nginx relaie ces appels vers le backend Express
4. Express interroge MariaDB et retourne du JSON
5. Angular affiche les données

---

## Les 3 couches

### 1. Base de données — `database/init.sql`

C'est **la source de vérité**. Elle contient :
- La définition des tables (`CREATE TABLE`)
- Toutes les données (`INSERT INTO`)

**Quand modifier ce fichier :**
- Ajouter un équipement → `INSERT INTO devices`
- Modifier une IP WireGuard → `UPDATE sites SET wg_ip`
- Ajouter un VLAN → `INSERT INTO vlans`
- Associer un équipement à un VLAN → `INSERT INTO device_vlans`

**Après toute modification de `init.sql` :**
```bash
docker compose down -v && docker compose up -d
```
Le `-v` supprime le volume MariaDB pour que le fichier soit rejoué depuis zéro.

---

### 2. Backend — `backend/src/`

API REST en Node.js + Express. Chaque route lit la base de données
et retourne du JSON.

#### Fichiers principaux

| Fichier | Rôle |
|---|---|
| `index.ts` | Point d'entrée. Déclare les middlewares et branche les routes. |
| `types.ts` | Interfaces TypeScript : `Site`, `Device`, `Vlan`. Si tu ajoutes un champ en base, ajoute-le ici. |
| `db/pool.ts` | Gère la connexion à MariaDB. |
| `routes/sites.ts` | Répond à `/api/sites` |
| `routes/devices.ts` | Répond à `/api/devices` et `/api/devices/site/:id` |
| `routes/vlans.ts` | Répond à `/api/vlans` et `/api/vlans/site/:id` |

#### Lire une route

Toutes les routes ont la même forme :

```typescript
router.get('/site/:siteId', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ...`, [req.params.siteId]);
    res.json(rows);   // ← envoie le résultat au frontend
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});
```

- `pool.query(sql, params)` → exécute une requête SQL
- `res.json(data)` → retourne la réponse JSON
- `req.params.xxx` → paramètre dans l'URL (ex: `:siteId`)

---

### 3. Frontend — `frontend/src/app/`

Application Angular 17 avec des composants standalone.

#### Fichiers principaux

| Fichier | Rôle |
|---|---|
| `core/api.service.ts` | Fait les appels HTTP vers le backend. C'est ici que sont définies toutes les fonctions `getSites()`, `getDevicesBySite()`, etc. |
| `core/infrastructure.models.ts` | Interfaces TypeScript côté Angular. Doit rester en sync avec `backend/src/types.ts`. |
| `features/diagram/diagram.component.ts` | La page principale. Charge les sites et orchestre l'affichage. |
| `shared/components/site-panel.component.ts` | Panneau d'un site (LIR, EVR…). Charge les équipements du site. |
| `shared/components/device-card.component.ts` | Carte d'un équipement (routeur, serveur, VM…). |
| `shared/components/vlan-card.component.ts` | Carte d'un VLAN dans le plan d'adressage. |
| `shared/device.pipes.ts` | Fonctions de formatage utilisées dans les templates (label du type, couleur du VLAN…). |

---

## Comment lire un composant Angular

Chaque fichier `.component.ts` a toujours la même structure :

```typescript
@Component({
  selector: 'app-nom',      // balise HTML utilisée par le parent
  standalone: true,
  imports: [...],           // dépendances de ce composant
  template: `...`,          // ← HTML affiché (modifie ici pour changer l'affichage)
  styles: [`...`]           // ← CSS (modifie ici pour changer les couleurs/layout)
})
export class NomComponent {

  @Input() data!: Type;     // donnée reçue du composant parent
  @Output() event = new EventEmitter(); // événement envoyé vers le parent

  // propriétés et méthodes
}
```

**Règle pratique :**
- Tu veux **changer l'affichage** → modifie `template`
- Tu veux **changer le style** → modifie `styles`
- Tu veux **changer la logique** → modifie la classe

---

## Syntaxe Angular dans les templates

```html
<!-- Afficher une valeur -->
{{ device.hostname }}

<!-- Condition -->
@if (device.status === 'active') {
  <span>Actif</span>
}

<!-- Boucle -->
@for (vm of device.children; track vm.id) {
  <div>{{ vm.hostname }}</div>
}

<!-- Passer une donnée à un composant enfant -->
<app-device-card [device]="monEquipement" />

<!-- Écouter un événement d'un composant enfant -->
<app-site-panel (vlansLoaded)="onVlansLoaded($event)" />

<!-- Appliquer une classe CSS dynamiquement -->
<div [ngClass]="'device-' + device.type">...</div>

<!-- Appliquer un style dynamiquement -->
<span [style.background]="vlan.number | vlanColor">...</span>
```

---

## Recettes pratiques

### Ajouter un équipement

Dans `database/init.sql`, ajoute un `INSERT INTO devices` :

```sql
INSERT INTO devices (hostname, type, model, specs, link_type, services, site_id, parent_id, status) VALUES
(
  'LIR-NOUVEAUVM-001', 'server',
  'Debian 12 (VM Proxmox)',
  '2 vCPU · 4 Go RAM',
  'rj45',
  'Mon service A · Mon service B',
  1,    -- site_id : 1=LIR, 2=EVR
  NULL, -- parent_id : NULL si racine, sinon ID de l'hyperviseur parent
  'active'
);
```

Si c'est une VM sous Proxmox, ajoute-la au `UPDATE` qui assigne les `parent_id` :

```sql
UPDATE devices SET parent_id = (SELECT id FROM (SELECT id FROM devices WHERE hostname = 'LIR-PXMPVE-001') t)
WHERE hostname IN ('LIR-NOUVEAUVM-001');
```

Puis associe-la à un VLAN :

```sql
INSERT INTO device_vlans (device_id, vlan_id)
SELECT d.id, v.id FROM devices d JOIN vlans v ON v.site_id = d.site_id
WHERE d.hostname = 'LIR-NOUVEAUVM-001' AND v.number = 10;
```

---

### Modifier une IP WireGuard

Dans `database/init.sql`, ligne des `INSERT INTO sites` :

```sql
INSERT INTO sites (code, name, location, status, wg_ip) VALUES
  ('LIR', 'Liré', 'Maine-et-Loire (49)', 'active', '10.0.0.1'),  -- ← changer ici
```

---

### Ajouter un champ à un équipement

Exemple : ajouter un champ `os_version` (version de l'OS).

**Étape 1 — Base de données** (`database/init.sql`) :
```sql
CREATE TABLE IF NOT EXISTS devices (
  ...
  os_version VARCHAR(50),   -- ← ajouter la colonne
  ...
);
```
Et renseigne la valeur dans les `INSERT INTO devices`.

**Étape 2 — Type backend** (`backend/src/types.ts`) :
```typescript
export interface Device {
  ...
  os_version?: string;   // ← ajouter le champ
}
```

**Étape 3 — Type frontend** (`frontend/src/app/core/infrastructure.models.ts`) :
```typescript
export interface Device {
  ...
  os_version?: string;   // ← même chose côté Angular
}
```

**Étape 4 — Affichage** (`frontend/src/app/shared/components/device-card.component.ts`) :
```html
@if (device.os_version) {
  <div class="device-os">{{ device.os_version }}</div>
}
```

---

### Changer la couleur d'un type d'équipement

Dans `device-card.component.ts`, section `styles` :

```css
.device-server  { border-color: #6d28d9; }   /* ← changer la couleur ici */
.device-server  .device-title { color: #a78bfa; }
```

Les couleurs utilisent le format hexadécimal (`#rrggbb`).

---

### Modifier le plan d'adressage VLAN

Dans `database/init.sql`, section `INSERT INTO vlans` :

```sql
INSERT INTO vlans (number, name, ip_range, gateway, type, mtu, site_id) VALUES
(10, 'Serveurs', '10.1.10.0/24', '10.1.10.254', 'intersite', 1500, 1),
--                ^^^^^^^^^^^^^^   ^^^^^^^^^^^^
--                range IP          passerelle
```

Les types possibles : `intersite`, `local`, `isolated`.

---

## Flux de données complet

Pour visualiser le chemin d'une donnée de la base jusqu'à l'écran :

```
init.sql
  INSERT INTO devices (hostname='LIR-RTR-001', ...)
        │
        ▼
backend/routes/devices.ts
  SELECT d.* FROM devices → retourne JSON
        │
        ▼
frontend/core/api.service.ts
  getDevicesBySite(siteId) → Observable<Device[]>
        │
        ▼
frontend/shared/components/site-panel.component.ts
  this.devices = devices  (chargé dans ngOnInit)
        │
        ▼
frontend/shared/components/device-card.component.ts
  @Input() device!: Device
  template: {{ device.hostname }}  → affiché dans le navigateur
```

---

## Résumé — Quoi modifier selon ce que tu veux faire

| Objectif | Fichier(s) à modifier |
|---|---|
| Ajouter / modifier des données | `database/init.sql` |
| Changer l'affichage d'une carte équipement | `device-card.component.ts` → `template` |
| Changer les couleurs d'une carte | `device-card.component.ts` → `styles` |
| Changer l'affichage d'un VLAN | `vlan-card.component.ts` → `template` |
| Changer la mise en page des sites | `site-panel.component.ts` |
| Changer la page principale | `diagram.component.ts` |
| Ajouter un nouveau champ en base | `init.sql` + `types.ts` (backend) + `infrastructure.models.ts` (frontend) + composant |
| Modifier les credentials de la BDD | `.env` |
| Ajouter une nouvelle route API | `backend/src/routes/*.ts` + `api.service.ts` |
