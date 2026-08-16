import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import routes from './routes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '5001');

// ── Helmet: secure HTTP headers ───────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],  // needed for Vite/React
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // allows favicon/images from external domains
}));

// ── CORS: portal domain + localhost only ──────────────────────
const ALLOWED_ORIGINS = [
  'https://broadpeak-portal.onrender.com',
  'https://broadpeak-portal.pplx.app',
  /^http:\/\/localhost:\d+$/,
];
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server (no origin) and matched origins
    if (!origin) return cb(null, true);
    const allowed = ALLOWED_ORIGINS.some(o =>
      typeof o === 'string' ? o === origin : o.test(origin)
    );
    cb(allowed ? null : new Error('Not allowed by CORS'), allowed);
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────
// Login: 10 attempts per 15 min per IP (brute-force protection)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin login: stricter — 5 attempts per 15 min
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many admin login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API: 300 req/min per IP (prevents scraping/abuse)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/login', loginLimiter);
app.use('/api/admin/login', adminLoginLimiter);
app.use('/api', apiLimiter);

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
