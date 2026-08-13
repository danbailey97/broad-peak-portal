import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import routes from './routes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5001');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(routes);

// Serve uploads
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
app.use('/uploads', express.static(path.join(DATA_DIR, 'uploads')));

// Serve frontend
const DIST = path.join(process.cwd(), 'dist', 'public');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  app.get('*', (_, res) => res.sendFile(path.join(DIST, 'index.html')));
}

app.listen(PORT, () => console.log(`BP Portal running on port ${PORT}`));
