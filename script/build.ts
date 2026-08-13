import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function buildAll() {
  // 1. Build frontend using Vite programmatic API (runs from ROOT, finds node_modules correctly)
  console.log('Building frontend…');
  await viteBuild({
    configFile: path.join(ROOT, 'client/vite.config.ts'),
    root: path.join(ROOT, 'client'),
    build: {
      outDir: path.join(ROOT, 'dist/public'),
      emptyOutDir: true,
    },
    define: {
      'import.meta.env.VITE_API_BASE': JSON.stringify(''),
    },
  });

  // 2. Build backend with esbuild
  console.log('Building server…');
  await esbuild({
    entryPoints: [path.join(ROOT, 'server/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: path.join(ROOT, 'dist/index.cjs'),
    external: ['better-sqlite3'],
    define: {
      'process.env.GROQ_API_KEY': JSON.stringify(process.env.GROQ_API_KEY || ''),
    },
  });

  console.log('Build complete.');
}

buildAll().catch(e => { console.error(e); process.exit(1); });
