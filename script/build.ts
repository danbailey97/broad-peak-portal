import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import { fileURLToPath } from 'url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function buildAll() {
  console.log('Building frontend…');
  await viteBuild({
    configFile: path.resolve(ROOT, 'vite.config.ts'),
  });

  console.log('Building server…');
  await esbuild({
    entryPoints: [path.resolve(ROOT, 'server/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: path.resolve(ROOT, 'dist/index.cjs'),
    external: ['better-sqlite3'],
  });

  console.log('Build complete.');
}

buildAll().catch(e => { console.error(e); process.exit(1); });
