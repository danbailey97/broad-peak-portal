import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';

async function buildAll() {
  console.log('Building frontend…');
  await viteBuild();

  console.log('Building server…');
  await esbuild({
    entryPoints: ['server/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: 'dist/index.cjs',
    external: ['better-sqlite3'],
  });

  console.log('Build complete.');
}

buildAll().catch(e => { console.error(e); process.exit(1); });
