import express from 'express';
import cors from 'cors';
import authRouter    from './routes/auth';
import sitesRouter   from './routes/sites';
import devicesRouter from './routes/devices';
import vlansRouter   from './routes/vlans';

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:4200' }));
app.use(express.json());

app.use('/api/auth',    authRouter);
app.use('/api/sites',   sitesRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/vlans',   vlansRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ BtSysnet API démarrée sur http://localhost:${PORT}`);
});
