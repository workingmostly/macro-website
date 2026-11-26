// Renders the carousel into instagram/portfolio: stills as PNG, videos as H.264 MP4 (30 fps, no sound, as Instagram
// takes them), plus a PNG of each video's poster frame in previews/.
//
// From the repo root:
//   node instagram/portfolio/source/render.mjs              every slide
//   node instagram/portfolio/source/render.mjs swipe voice  just these
//   node instagram/portfolio/source/render.mjs --posters    stills and video posters only (quick)
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const here = fileURLToPath(new URL('.', import.meta.url));
const out = fileURLToPath(new URL('..', import.meta.url));
const previews = `${out}previews/`;
const FPS = 30;
const clip = { x: 0, y: 0, width: 1080, height: 1440 };

const args = process.argv.slice(2);
const postersOnly = args.includes('--posters');
const only = args.filter((a) => !a.startsWith('--'));

const server = await createServer({ configFile: `${here}vite.config.ts` });
await server.listen();
const base = `http://localhost:${server.config.server.port}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1440 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.error('console:', m.text());
});

async function open(id, t) {
  await page.goto(`${base}/?slide=${id}&t=${t}`);
  await page.evaluate(() => window.__ready);
}

await open('cover', 0);
const meta = await page.evaluate(() => window.__meta);
await mkdir(previews, { recursive: true });

for (const s of meta) {
  if (only.length && !only.includes(s.id)) continue;
  await open(s.id, s.poster);
  if (s.kind === 'still') {
    await page.screenshot({ path: `${out}${s.file}.png`, clip });
    console.log(`${s.file}.png`);
    continue;
  }
  await page.screenshot({ path: `${previews}${s.file}.png`, clip });
  if (postersOnly) {
    console.log(`previews/${s.file}.png`);
    continue;
  }
  const frames = Math.round(s.duration * FPS);
  const ff = spawn(
    'ffmpeg',
    [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      `${out}${s.file}.mp4`,
    ],
    { stdio: ['pipe', 'inherit', 'inherit'] },
  );
  const done = new Promise((resolve, reject) => ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))));
  for (let i = 0; i < frames; i++) {
    await page.evaluate((t) => window.__setTime(t), i / FPS);
    const png = await page.screenshot({ clip });
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await done;
  console.log(`${s.file}.mp4 (${frames} frames)`);
}

await browser.close();
await server.close();
