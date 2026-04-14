# Base de données — Guide pratique

Ce fichier explique comment fonctionne `init.sql`, comment modifier les données,
et comment gérer la base en production.

---

## Comment fonctionne l'initialisation

MariaDB exécute automatiquement tous les fichiers `.sql` présents dans
`/docker-entrypoint-initdb.d/` **uniquement lors de la première création du volume**.

```yaml
# docker-compose.yml
volumes:
  - mariadb_data:/var/lib/mysql          ← données persistantes
  - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql:ro  ← script initial
```

**Conséquence importante :** si le volume `mariadb_data` existe déjà,
`init.sql` n'est **jamais** rejoué, même si tu l'as modifié.

---

## Quand faire `docker compose down -v`

Le `-v` supprime le volume et force MariaDB à tout recréer depuis `init.sql`.

| Situation | Commande |
|---|---|
| Modification de `init.sql` (données ou schéma) | `docker compose down -v && docker compose up -d` |
| Base corrompue ou incohérente | `docker compose down -v && docker compose up -d` |
| Simple redémarrage sans changement de données | `docker compose restart` |
| Mise à jour du code uniquement | `docker compose up -d --build` |

> ⚠️ `down -v` **efface toutes les données**. En prod, fais-le uniquement
> quand `init.sql` est la seule source de vérité (ce qui est le cas ici).

---

## Structure de `init.sql`

Le fichier se découpe en 5 parties dans l'ordre :

```
1. CREATE TABLE      → définit les tables
2. INSERT sites      → les 3 sites (LIR, EVR, NS)
3. INSERT devices    → les équipements (par site)
4. UPDATE parent_id  → rattache les VMs à leur hyperviseur
5. INSERT vlans      → les plans d'adressage
6. INSERT vlan_services → les services sur chaque VLAN
7. INSERT device_vlans  → associe chaque équipement à ses VLANs
```

L'ordre est **obligatoire** : les clés étrangères imposent que les sites
existent avant les équipements, les équipements avant les device_vlans, etc.

---

## Les tables et leurs relations

```
sites
  │
  ├── devices (site_id → sites.id)
  │     └── devices (parent_id → devices.id)  ← VMs sous hyperviseur
  │
  └── vlans (site_id → sites.id)
        ├── vlan_services (vlan_id → vlans.id)
        └── device_vlans (vlan_id → vlans.id, device_id → devices.id)
```

---

## Colonnes de la table `devices`

L'ordre des colonnes dans les INSERT est toujours :

```sql
INSERT INTO devices (hostname, type, model, specs, link_type, services, site_id, parent_id, status)
```

| Colonne | Type | Valeurs possibles | Exemple |
|---|---|---|---|
| `hostname` | VARCHAR | Unique | `'LIR-RTR-001'` |
| `type` | ENUM | `router` `switch` `server` `nas` `pbs` `ha` `gns` `ap` `placeholder` | `'server'` |
| `model` | VARCHAR | Texte libre | `'Debian 13 (VM Proxmox)'` |
| `specs` | VARCHAR | Texte libre | `'4 vCPU · 8 Go RAM'` |
| `link_type` | ENUM | `fiber` `sfp` `rj45` `rj45-4x` | `'rj45'` |
| `services` | TEXT | Texte libre, séparé par ` · ` | `'Docker · Nginx'` |
| `site_id` | INT | `1` = LIR · `2` = EVR · `3` = NS | `1` |
| `parent_id` | INT | `NULL` si racine, sinon ID de l'hyperviseur | `NULL` |
| `status` | ENUM | `active` `planned` `placeholder` | `'active'` |

> ⚠️ Les colonnes ENUM rejettent toute valeur non listée et font échouer
> l'INSERT entier. Si un INSERT échoue, **toutes les données suivantes**
> sont perdues (cascade d'erreurs sur les clés étrangères).

---

## Ajouter un équipement

### 1. Équipement physique (routeur, switch, NAS...)

```sql
INSERT INTO devices (hostname, type, model, specs, link_type, services, site_id, parent_id, status) VALUES
(
  'LIR-NAS-002', 'nas',
  'Synology DS923+',
  '4 Go RAM · 4 baies',
  'rj45',
  'Synology DSM · SMB · NFS',
  1, NULL, 'active'
);
```

### 2. VM sous Proxmox

Ajoute le device avec `parent_id = NULL` d'abord, puis mets à jour avec le `UPDATE` :

```sql
-- Étape 1 : INSERT
INSERT INTO devices (...) VALUES
(
  'LIR-DEBDOCK-005', 'server',
  'Debian 13 (VM Proxmox)',
  '2 vCPU · 4 Go RAM',
  'rj45',
  'Mon service',
  1, NULL, 'active'
);

-- Étape 2 : rattacher à l'hyperviseur
UPDATE devices
SET parent_id = (SELECT id FROM (SELECT id FROM devices WHERE hostname = 'LIR-PXMPVE-001') t)
WHERE hostname = 'LIR-DEBDOCK-005';

-- Étape 3 : associer à un VLAN
INSERT INTO device_vlans (device_id, vlan_id)
SELECT d.id, v.id FROM devices d JOIN vlans v ON v.site_id = d.site_id
WHERE d.hostname = 'LIR-DEBDOCK-005' AND v.number = 10;
```

### 3. Équipement planifié (à venir)

Utilise `status = 'planned'` — il apparaîtra avec un badge "PLANIFIÉ" :

```sql
INSERT INTO devices (..., status) VALUES
(..., 'planned');
```

---

## Modifier un équipement existant

Dans `init.sql`, trouve la ligne concernée et modifie la valeur.
Puis recrée le volume :

```bash
docker compose down -v && docker compose up -d
```

**Exemples courants :**

```sql
-- Changer les specs d'une VM
'4 vCPU · 8 Go RAM',   -- ← modifier ici

-- Changer les services affichés
'Docker · Nginx · Portainer',   -- ← séparés par ' · '

-- Passer un équipement en "planifié"
'planned'   -- ← à la place de 'active'
```

---

## Modifier les VLANs

```sql
INSERT INTO vlans (number, name, ip_range, gateway, type, mtu, site_id) VALUES
(10, 'Serveurs', '10.1.10.0/24', '10.1.10.254', 'intersite', 1500, 1);
--               ^^^^^^^^^^^^^^   ^^^^^^^^^^^^   ^^^^^^^^^^
--               plage IP          passerelle      type
```

| Champ `type` | Signification |
|---|---|
| `intersite` | Routé entre les sites via WireGuard |
| `local` | Isolé au site |
| `isolated` | Pas de routage inter-VLAN |

---

## Vérifier la base en production

Se connecter à MariaDB depuis la VM :

```bash
docker compose exec mariadb mariadb -u proxima -pproximapassword proxima_infra
```

Commandes utiles une fois connecté :

```sql
-- Lister tous les sites
SELECT * FROM sites;

-- Lister les équipements d'un site
SELECT hostname, type, status FROM devices WHERE site_id = 1;

-- Vérifier les VMs et leur hyperviseur
SELECT vm.hostname AS vm, parent.hostname AS hyperviseur
FROM devices vm
JOIN devices parent ON vm.parent_id = parent.id;

-- Vérifier les associations VLAN
SELECT d.hostname, v.number, v.name
FROM devices d
JOIN device_vlans dv ON dv.device_id = d.id
JOIN vlans v ON v.id = dv.vlan_id
ORDER BY d.hostname, v.number;

-- Quitter
exit
```

---

## Corriger une erreur sans tout recréer

Si tu veux corriger une donnée sans faire `down -v` (pour ne pas perdre
d'autres données éventuellement saisies manuellement) :

```bash
docker compose exec mariadb mariadb -u proxima -pproximapassword proxima_infra
```

```sql
-- Modifier une valeur directement
UPDATE devices SET specs = '8 vCPU · 16 Go RAM' WHERE hostname = 'LIR-PXMPVE-001';

-- Ajouter un équipement manuellement
INSERT INTO devices (...) VALUES (...);

-- Supprimer un équipement
DELETE FROM devices WHERE hostname = 'LIR-OLD-001';
```

> Ces modifications sont **perdues** au prochain `down -v`.
> Pense à reporter les changements dans `init.sql` pour qu'ils soient permanents.

---

## Erreurs fréquentes

### La base est vide après `docker compose up`

`init.sql` a échoué silencieusement. Causes possibles :
- Valeur invalide dans une colonne ENUM (`link_type`, `type`, `status`)
- Nombre de valeurs incorrect dans un INSERT (doit correspondre exactement aux colonnes déclarées)
- Clé étrangère non respectée (ex: `site_id = 5` alors que ce site n'existe pas)

**Diagnostic :**
```bash
docker compose exec mariadb mariadb -u proxima -pproximapassword proxima_infra -e "SELECT * FROM sites;"
# Si vide → l'INSERT INTO sites a échoué → cherche la première erreur
```

### Comment compter ses colonnes

La ligne `INSERT INTO devices (col1, col2, ...) VALUES` déclare N colonnes.
Chaque entrée `(val1, val2, ...)` doit avoir exactement N valeurs.

```
(hostname, type, model, specs, link_type, services, site_id, parent_id, status)
    1        2     3      4       5           6         7         8        9
```
