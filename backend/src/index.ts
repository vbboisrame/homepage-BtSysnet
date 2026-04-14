import express from 'express';
import cors from 'cors';
import sitesRouter   from './routes/sites';
import devicesRouter from './routes/devices';
import vlansRouter   from './routes/vlans';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ──────────────────────────────────────────────
// CORS : autorise Angular (port 4200 en dev) à appeler l'API
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:4200'
}));
// Parse le JSON dans les requêtes (utile pour le CRUD plus tard)
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/sites',   sitesRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/vlans',   vlansRouter);

// Route de santé — permet de vérifier que l'API tourne
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Démarrage ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ PROXIMA API démarrée sur http://localhost:${PORT}`);
  console.log(`   Routes disponibles :`);
  console.log(`   GET /api/sites`);
  console.log(`   GET /api/devices`);
  console.log(`   GET /api/devices/site/:siteId`);
  console.log(`   GET /api/vlans`);
  console.log(`   GET /api/vlans/site/:siteId`);
  console.log(`   GET /health`);
});
