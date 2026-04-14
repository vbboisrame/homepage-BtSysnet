# BtSysnet — Diagramme d'infrastructure réseau

Application web de visualisation de l'infrastructure réseau BtSysnet.

Stack : **Angular 17** · **Express + Node.js** · **MariaDB 11.4** · **Docker**

---

## Premier déploiement

```bash
# 1. Cloner le dépôt
git clone https://github.com/...
cd homepage-BtSysnet

# 2. Créer le fichier de configuration (credentials)
cp .env.example .env
nano .env   # renseigner les mots de passe

# 3. Lancer la stack complète
docker compose up -d --build
```

L'application est accessible sur **http://localhost:8080**

> La base de données est automatiquement initialisée au premier démarrage
> avec toutes les données de l'infrastructure (sites, équipements, VLANs).

---

## Prérequis

| Outil | Version min | Vérification |
|---|---|---|
| Docker | 24+ | `docker --version` |
| Docker Compose | 2+ | `docker compose version` |
| Git | — | `git --version` |
| Node.js *(dev uniquement)* | 20+ | `node --version` |

---

## Commandes courantes

```bash
# Démarrer
docker compose up -d

# Rebuilder après modification du code
docker compose up -d --build

# Rebuilder un seul service
docker compose up -d --build frontend

# Réinitialiser la base de données (recharge init.sql)
docker compose down -v && docker compose up -d

# Voir les logs
docker compose logs backend --tail=50
docker compose logs frontend --tail=50

# Arrêter
docker compose down
```

---

## Démarrage en mode développement

En mode dev, le rechargement automatique est actif : toute modification de fichier
rafraîchit instantanément le navigateur.

### Étape 1 — MariaDB via Docker

```bash
docker compose up -d mariadb
```

### Étape 2 — Backend

```bash
cd backend
npm install       # une seule fois
npm run dev
```

Backend disponible sur **http://localhost:3000**

### Étape 3 — Frontend Angular

Dans un nouveau terminal :

```bash
cd frontend
npm install       # une seule fois
npm start
```

Frontend disponible sur **http://localhost:4200**

> Le `proxy.conf.json` redirige automatiquement `/api/*` vers le backend (port 3000).

---

## Structure du projet

```
homepage-BtSysnet/
│
├── .env                            ← Credentials (ne jamais committer)
├── .env.example                    ← Template à copier pour configurer
├── docker-compose.yml              ← Orchestration des 3 services
│
├── database/
│   └── init.sql                    ← Schéma + données initiales
│
├── backend/                        ← API REST (Node.js + Express)
│   └── src/
│       ├── index.ts                ← Point d'entrée, configuration Express
│       ├── types.ts                ← Interfaces TypeScript (Site, Device, Vlan)
│       ├── db/
│       │   └── pool.ts             ← Pool de connexions MariaDB
│       └── routes/
│           ├── sites.ts            ← GET /api/sites
│           ├── devices.ts          ← GET /api/devices, /api/devices/site/:id
│           └── vlans.ts            ← GET /api/vlans, /api/vlans/site/:id
│
└── frontend/                       ← Application Angular 17
    └── src/app/
        ├── app.component.ts        ← Racine : header + router-outlet
        ├── app.routes.ts           ← Définition des URLs
        ├── app.config.ts           ← Configuration (HttpClient, Router)
        │
        ├── core/
        │   ├── api.service.ts      ← Appels HTTP vers le backend
        │   └── infrastructure.models.ts  ← Types TypeScript côté Angular
        │
        ├── shared/
        │   ├── device.pipes.ts     ← Pipes de formatage (labels, couleurs)
        │   └── components/
        │       ├── site-panel.component.ts   ← Panneau d'un site
        │       ├── device-card.component.ts  ← Carte d'un équipement
        │       ├── vlan-card.component.ts    ← Carte d'un VLAN
        │       └── recap-table.component.ts  ← Tableau récapitulatif
        │
        └── features/
            └── diagram/
                └── diagram.component.ts      ← Page principale
```

---

## Routes API

| Méthode | URL | Description |
|---|---|---|
| GET | `/health` | Santé du serveur |
| GET | `/api/sites` | Tous les sites |
| GET | `/api/devices` | Tous les équipements (avec site) |
| GET | `/api/devices/site/:id` | Équipements d'un site (arborescence VM) |
| GET | `/api/devices/:id` | Un équipement par ID |
| GET | `/api/vlans` | Tous les VLANs (avec services) |
| GET | `/api/vlans/site/:id` | VLANs d'un site |

---

## Variables d'environnement

Copie `.env.example` en `.env` et remplis les valeurs :

| Variable | Description |
|---|---|
| `MYSQL_DATABASE` | Nom de la base de données |
| `MYSQL_USER` | Utilisateur MariaDB |
| `MYSQL_PASSWORD` | Mot de passe MariaDB |
| `DB_HOST` | Hôte MariaDB (dans Docker : `mariadb`) |
| `PORT` | Port du backend Express (défaut : `3000`) |
| `CORS_ORIGIN` | Origine autorisée en dev (défaut : `http://localhost:4200`) |

---

## Documentation

Consulte [ARCHITECTURE.md](ARCHITECTURE.md) pour comprendre comment le code
fonctionne et comment le modifier toi-même.
