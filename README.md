# BtSysnet — Diagramme d'infrastructure réseau

Application web de visualisation de l'infrastructure réseau BtSysnet.

Stack : **Angular 17** · **Express + Node.js** · **MariaDB 11.4** · **Docker**

---

## Workflow de déploiement

```
PC Windows (VS Code)
        │
        │  git commit + git push
        ▼
    GitHub
        │
        │  git pull (sur la VM)
        ▼
VM Docker (EVR-DEBDOCK-001)
        │
        │  docker compose up -d --build
        ▼
Site accessible sur http://<IP-VM>:8080
```

### Déployer une mise à jour

Depuis la VM :

```bash
cd ~/homepage-BtSysnet
git pull
docker compose up -d --build
```

### Réinitialiser la base de données

À faire uniquement si `database/init.sql` a été modifié :

```bash
docker compose down -v && docker compose up -d --build
```

> ⚠️ Le `-v` supprime toutes les données. MariaDB repart de zéro depuis `init.sql`.

---

## Installation initiale sur une nouvelle VM

```bash
# 1. Cloner le dépôt
git clone https://github.com/... homepage-BtSysnet
cd homepage-BtSysnet

# 2. Créer le fichier de configuration
cp .env.example .env
nano .env   # renseigner les mots de passe

# 3. Lancer la stack
docker compose up -d --build
```

---

## Prérequis (VM de production)

| Outil | Version min | Vérification |
|---|---|---|
| Docker | 24+ | `docker --version` |
| Docker Compose | 2+ | `docker compose version` |
| Git | — | `git --version` |

---

## Prérequis (PC de développement)

| Outil | Version min |
|---|---|
| Node.js | 20+ |
| npm | 10+ |
| Git | — |

---

## Développement local

Pour itérer rapidement sans passer par Docker :

### Étape 1 — MariaDB via Docker

```bash
docker compose up -d mariadb
```

### Étape 2 — Backend

```bash
cd backend
npm install       # une seule fois
npm run dev       # rechargement automatique
```

Backend disponible sur **http://localhost:3000**

### Étape 3 — Frontend Angular

Dans un nouveau terminal :

```bash
cd frontend
npm install       # une seule fois
npm start         # rechargement automatique
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
│   └── init.sql                    ← Schéma + données (modifié ici = down -v requis)
│
├── backend/                        ← API REST (Node.js + Express)
│   └── src/
│       ├── index.ts                ← Point d'entrée Express
│       ├── types.ts                ← Interfaces TypeScript
│       ├── db/pool.ts              ← Connexion MariaDB
│       └── routes/
│           ├── sites.ts
│           ├── devices.ts
│           └── vlans.ts
│
└── frontend/                       ← Application Angular 17
    └── src/app/
        ├── core/
        │   ├── api.service.ts                ← Appels HTTP
        │   └── infrastructure.models.ts      ← Types TypeScript
        ├── shared/
        │   ├── device.pipes.ts               ← Pipes de formatage
        │   └── components/
        │       ├── site-panel.component.ts
        │       ├── device-card.component.ts
        │       ├── vlan-card.component.ts
        │       └── recap-table.component.ts
        └── features/diagram/
            └── diagram.component.ts          ← Page principale
```

---

## Routes API

| Méthode | URL | Description |
|---|---|---|
| GET | `/health` | Santé du serveur |
| GET | `/api/sites` | Tous les sites |
| GET | `/api/devices` | Tous les équipements |
| GET | `/api/devices/site/:id` | Équipements d'un site (arborescence) |
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
fonctionne et comment le modifier.
