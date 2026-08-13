import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function main() {
  // 1. Build frontend with Vite
  console.log('Building frontend…');
  execSync('npx vite build', { cwd: path.join(ROOT, 'client'), stdio: 'inherit', env: { ...process.env, VITE_API_BASE: '' } });

  // 2. Build backend with esbuild
  console.log('Building server…');
  await build({
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

main().catch(e => { console.error(e); process.exit(1); });
