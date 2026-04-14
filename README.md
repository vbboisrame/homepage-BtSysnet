# PROXIMA Infra — Documentation

Stack : **Angular 17** · **Express + Node.js** · **mysql2** · **MariaDB 11.4** · **Docker**

---

## Prérequis

Installe ces outils sur ta machine de dev (ou directement dans une VM PROXIMA) :

| Outil | Version min | Vérification |
|---|---|---|
| Node.js | 20+ | `node --version` |
| npm | 10+ | `npm --version` |
| Docker | 24+ | `docker --version` |
| Docker Compose | 2+ | `docker compose version` |
| Git | — | `git --version` |

---

## Démarrage rapide (tout en Docker)

```bash
# 1. Cloner ou décompresser le projet
cd proxima-infra

# 2. Lancer toute la stack (MariaDB + backend + frontend)
docker compose up -d

# 3. Vérifier que tout tourne
docker compose ps
```

L'application est accessible sur **http://localhost:8080**

L'API est accessible sur **http://localhost:3000**

> La base de données est automatiquement initialisée au premier démarrage
> avec toutes les données de ton infrastructure (sites, équipements, VLANs).

---

## Démarrage en mode développement

En mode dev, tu lances le backend et le frontend séparément.
Cela permet d'avoir le **rechargement automatique** : dès que tu modifies
un fichier, le navigateur se rafraîchit instantanément.

### Étape 1 — Lancer MariaDB seule (via Docker)

```bash
docker compose up -d mariadb
```

### Étape 2 — Lancer le backend

```bash
cd backend

# Installer les dépendances (une seule fois)
npm install

# Démarrer en mode dev (rechargement automatique)
npm run dev
```

Le backend écoute sur **http://localhost:3000**

Tu peux tester dans ton navigateur :
- http://localhost:3000/health  → `{"status":"ok"}`
- http://localhost:3000/api/sites
- http://localhost:3000/api/devices
- http://localhost:3000/api/vlans

### Étape 3 — Lancer le frontend Angular

Dans un **nouveau terminal** :

```bash
cd frontend

# Installer les dépendances Angular (une seule fois — ~500 Mo)
npm install

# Démarrer le serveur de développement
npm start
```

L'application est accessible sur **http://localhost:4200**

> Le `proxy.conf.json` redirige automatiquement les appels `/api/*`
> vers le backend sur le port 3000. Tu n'as rien à configurer.

---

## Structure du projet

```
proxima-infra/
│
├── docker-compose.yml          ← Orchestration des 3 services
│
├── database/
│   └── init.sql                ← Création des tables + données initiales
│
├── backend/                    ← API REST (Node.js + Express + mysql2)
│   ├── src/
│   │   ├── index.ts            ← Point d'entrée, configuration Express
│   │   ├── types.ts            ← Interfaces TypeScript (Site, Device, Vlan)
│   │   ├── db/
│   │   │   └── pool.ts         ← Connexion MariaDB (pool de connexions)
│   │   └── routes/
│   │       ├── sites.ts        ← GET /api/sites, GET /api/sites/:id
│   │       ├── devices.ts      ← GET /api/devices, GET /api/devices/site/:id
│   │       └── vlans.ts        ← GET /api/vlans, GET /api/vlans/site/:id
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
└── frontend/                   ← Application Angular 17
    ├── src/
    │   ├── main.ts             ← Point d'entrée Angular
    │   ├── index.html          ← Page HTML racine
    │   ├── styles.css          ← Styles globaux (thème sombre)
    │   └── app/
    │       ├── app.config.ts   ← Configuration (HttpClient, Router)
    │       ├── app.routes.ts   ← Définition des URLs
    │       ├── app.component.ts← Composant racine (header + router-outlet)
    │       │
    │       ├── core/
    │       │   ├── models/
    │       │   │   └── infrastructure.models.ts  ← Types TypeScript
    │       │   └── services/
    │       │       └── api.service.ts            ← Appels HTTP vers l'API
    │       │
    │       ├── shared/
    │       │   ├── components/
    │       │   │   ├── device-card.component.ts  ← Carte d'un équipement
    │       │   │   ├── vlan-card.component.ts    ← Carte d'un VLAN
    │       │   │   ├── site-panel.component.ts   ← Panneau d'un site
    │       │   │   └── recap-table.component.ts  ← Tableau récapitulatif
    │       │   └── pipes/
    │       │       └── device.pipes.ts           ← Formatage dans les templates
    │       │
    │       └── features/
    │           └── diagram/
    │               └── diagram.component.ts      ← Page principale du diagramme
    ├── angular.json
    ├── proxy.conf.json         ← Redirige /api → backend en dev
    ├── nginx.conf              ← Config Nginx pour la prod
    ├── package.json
    ├── tsconfig.json
    └── Dockerfile
```

---

## Routes API disponibles

| Méthode | URL | Description |
|---|---|---|
| GET | `/health` | Santé du serveur |
| GET | `/api/sites` | Tous les sites |
| GET | `/api/sites/:id` | Un site par ID |
| GET | `/api/devices` | Tous les équipements (avec site) |
| GET | `/api/devices/site/:id` | Équipements d'un site (arborescence) |
| GET | `/api/devices/:id` | Un équipement par ID |
| GET | `/api/vlans` | Tous les VLANs (avec services) |
| GET | `/api/vlans/site/:id` | VLANs d'un site |

---

## Concepts Angular à retenir

### Composant standalone
Chaque composant est autonome : il déclare ses propres imports.
Plus besoin de `NgModule` (ancienne façon Angular).

```typescript
@Component({
  selector: 'app-exemple',
  standalone: true,        // ← autonome
  imports: [CommonModule], // ← ce dont il a besoin
  template: `<p>Hello</p>`
})
export class ExempleComponent {}
```

### @Input() — passage de données parent → enfant
```typescript
// Dans le composant enfant
@Input({ required: true }) device!: Device;

// Dans le template parent
<app-device-card [device]="monEquipement" />
```

### ngOnInit — chargement des données
```typescript
ngOnInit(): void {
  // Appelé une fois après l'initialisation du composant
  this.api.getSites().subscribe(sites => {
    this.sites = sites;
  });
}
```

### @for — boucle dans le template
```html
@for (site of sites; track site.id) {
  <app-site-panel [site]="site" />
}
```

### @if — condition dans le template
```html
@if (loading) {
  <div>Chargement...</div>
}
```

---

## Prochaines étapes (Phase 2 — CRUD)

Pour ajouter l'édition des équipements, il faudra :

1. **Backend** : ajouter les routes POST/PUT/DELETE dans `routes/devices.ts`
2. **Frontend** : créer un formulaire Angular (`ReactiveFormsModule`)
3. **Angular** : utiliser `HttpClient.post()` dans `api.service.ts`

---

## Variables d'environnement

Le backend lit ces variables (avec des valeurs par défaut) :

| Variable | Défaut | Description |
|---|---|---|
| `DB_HOST` | `localhost` | Hôte MariaDB |
| `DB_PORT` | `3306` | Port MariaDB |
| `DB_USER` | `proxima` | Utilisateur BDD |
| `DB_PASSWORD` | `proximapassword` | Mot de passe BDD |
| `DB_NAME` | `proxima_infra` | Nom de la BDD |
| `PORT` | `3000` | Port du serveur Express |
| `CORS_ORIGIN` | `http://localhost:4200` | Origine autorisée (CORS) |

> En production, change les mots de passe dans `docker-compose.yml` !
