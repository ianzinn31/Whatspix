import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { router as apiRoutes } from './routes/apiRoutes.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Whatspix AI Server',
    time: new Date().toISOString()
  });
});

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Localizar diretórios de arquivos e áudios com suporte a execução da raiz ou de server/
const resolveDir = (subpath: string) => {
  const candidates = [
    path.resolve(__dirname, '../../', subpath),
    path.resolve(__dirname, '../', subpath),
    path.resolve(process.cwd(), subpath),
    path.resolve(process.cwd(), '../', subpath)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  const fallback = candidates[0];
  fs.mkdirSync(fallback, { recursive: true });
  return fallback;
};

const audiosDir = resolveDir('data/audios');
const filesDir = resolveDir('data/files');

// Servir arquivos de áudio estáticos gerados para o WhatsApp/WAHA
app.use('/audios', express.static(audiosDir));

// Servir arquivos PDF e documentos oficiais para o WhatsApp/WAHA
app.use('/files', express.static(filesDir));

// Register routes
app.use('/api', apiRoutes);

// Servir frontend compilado em produção se client/dist existir
const clientDistCandidates = [
  path.resolve(__dirname, '../../client/dist'),
  path.resolve(__dirname, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist'),
  path.resolve(process.cwd(), '../client/dist')
];
const clientDist = clientDistCandidates.find((c) => fs.existsSync(c));
if (clientDist) {
  console.log(`📦 [PROD] Servindo Frontend compilado a partir de: ${clientDist}`);
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (
      req.path.startsWith('/api') ||
      req.path.startsWith('/ws') ||
      req.path.startsWith('/audios') ||
      req.path.startsWith('/files')
    ) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const server = createServer(app);

// WebSocket for real-time events (chat messages, live sales notifications, OCR status)
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  console.log('[WS] Cliente conectado ao stream em tempo real');

  ws.send(
    JSON.stringify({
      type: 'connection_established',
      message: 'Conectado ao Whatspix Realtime Engine'
    })
  );

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('[WS Message received]:', data);
    } catch {
      // Ignora erro de parse
    }
  });

  ws.on('close', () => {
    console.log('[WS] Cliente desconectado');
  });
});

server.listen(port, () => {
  console.log(`\n🚀 WHATSPIX AI BACKEND RODANDO NA PORTA ${port}`);
  console.log(`📡 API: http://localhost:${port}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${port}/ws\n`);
});
