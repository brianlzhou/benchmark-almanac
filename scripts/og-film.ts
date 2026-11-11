// Films the link previews in public/og/: for each scene, an MP4 loop that iMessage, Telegram and Discord play
// in the link bubble, and a PNG poster of its first frame (the finished chart) for every other app.
// Also renders public/apple-touch-icon.png and public/favicon.ico from the favicon.
//
//   node scripts/og-film.ts            every scene and the icons
//   node scripts/og-film.ts index      one scene
//
// 1. Starts `astro dev`, which serves the dev-only page src/og-film/Film.astro at /og-film/<scene>/.
// 2. Opens it in headless Chrome, calls window.film.seek(t) for each of the 240 frames and screenshots it.
// 3. Encodes the frames with ffmpeg (H.264, yuv420p, faststart) and writes the poster.
//
// Needs ffmpeg on PATH and Google Chrome, which playwright-core drives. CHROMIUM_PATH picks another browser.
// Rerun it after a data sync that changes the charts. Each file is named by a hash of its content
// (pace-1a2b3c4d.mp4), and the older files of that scene are removed. Apps cache previews by URL, and some
// ignore a query string, so a new film needs a new name. SeoHead.astro finds the current files by scene.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dev } from 'astro';
import { chromium } from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public/og');
const SCENES = ['ridge', 'pace', 'rise', 'index', 'reigns', 'reporting', 'build'];
const asked = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const scenes = asked.length ? asked.filter((s) => SCENES.includes(s)) : SCENES;
const FPS = 30;

type Film = { duration: number; fps: number; poster: number; seek: (t: number) => void; ready: Promise<string[]> };
declare global {
  interface Window {
    film: Film;
  }
}

if (spawnSync('ffmpeg', ['-version']).status !== 0) throw new Error('ffmpeg is not on PATH. Install it (brew install ffmpeg) and run this again.');

const kb = (p: string) => `${(statSync(p).size / 1024).toFixed(0)} KB`;

// No live reload: an edit elsewhere in the repo would otherwise reload the page in the middle of a film
const server = await dev({ root, logLevel: 'error', vite: { server: { hmr: false, watch: { ignored: ['**/*'] } } } });
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : { channel: 'chrome' });
mkdirSync(out, { recursive: true });
try {
  const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error(e));
  for (const scene of scenes) {
    await page.goto(`http://localhost:${server.address.port}/og-film/${scene}/?capture`, { timeout: 180_000 });
    await page.waitForFunction(() => !!window.film, null, { timeout: 180_000 });
    const fonts = await page.evaluate(() => window.film.ready);
    // Astro names each font family "<name>-<hash>"; a "fallback" face loading instead would change the type
    for (const want of ['Newsreader', 'Geist', 'Geist Mono'])
      if (!fonts.some((f) => new RegExp(`^${want}-[0-9a-f]+$`).test(f))) throw new Error(`${scene}: ${want} did not load (${fonts.join(', ')})`);
    const { duration } = await page.evaluate(() => ({ duration: window.film.duration }));
    const frames = Math.round(duration * FPS);
    const tmp = mkdtempSync(join(tmpdir(), `og-film-${scene}-`));
    try {
      for (let i = 0; i < frames; i++) {
        await page.evaluate((t) => window.film.seek(t), i / FPS);
        await page.screenshot({ path: join(tmp, `${String(i).padStart(4, '0')}.png`) });
      }
      const mp4 = join(tmp, 'film.mp4');
      // H.264 High at yuv420p is what iOS decodes in hardware. CRF 26 with the animation tune keeps thin lines and
      // type clean on a flat white page. One keyframe for the whole loop (-g) and no B-frame pyramid keep it small.
      // Equal quality for I, P and B frames (ipratio, pbratio) keeps the loop point from popping as it restarts.
      // faststart puts the index first, so a player can start before the whole file arrives. No audio track.
      const enc = spawnSync(
        'ffmpeg',
        [
          ...['-y', '-v', 'error', '-framerate', String(FPS), '-i', join(tmp, '%04d.png')],
          ...['-c:v', 'libx264', '-preset', 'veryslow', '-tune', 'animation', '-crf', '26', '-x264-params', 'ipratio=1.0:pbratio=1.0'],
          ...['-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level:v', '4.0', '-g', String(frames)],
          ...['-movflags', '+faststart', '-an', mp4],
        ],
        { stdio: 'inherit' },
      );
      if (enc.status !== 0) throw new Error(`ffmpeg failed on ${scene}`);
      // The poster is frame 0: the finished chart the loop opens and closes on. A 256-color palette halves the
      // file with no difference visible at 3x zoom, and keeps the busiest poster well under the roughly 300 KB
      // that WhatsApp accepts for a preview image. PNG, not JPEG, keeps the type sharp.
      const png = join(tmp, 'poster.png');
      const pal = spawnSync(
        'ffmpeg',
        ['-y', '-v', 'error', '-i', join(tmp, '0000.png'), '-vf', 'split[a][b];[a]palettegen=max_colors=256:stats_mode=full[p];[b][p]paletteuse=dither=sierra2_4a', '-pred', 'mixed', png],
        { stdio: 'inherit' },
      );
      if (pal.status !== 0) writeFileSync(png, readFileSync(join(tmp, '0000.png')));
      // name both by content, then drop this scene's older files
      const named = (file: string, ext: string) => `${scene}-${createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8)}.${ext}`;
      const keep = [named(mp4, 'mp4'), named(png, 'png')];
      for (const f of readdirSync(out)) if (new RegExp(`^${scene}(-[0-9a-f]{8})?\\.(mp4|png)$`).test(f) && !keep.includes(f)) rmSync(join(out, f));
      copyFileSync(mp4, join(out, keep[0]));
      copyFileSync(png, join(out, keep[1]));
      console.log(`${scene}: ${frames} frames, public/og/${keep[0]} ${kb(join(out, keep[0]))}, public/og/${keep[1]} ${kb(join(out, keep[1]))}`);
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (!asked.length) {
    // the home-screen and Messages icon: the favicon's three bars on white, 180 px, which iOS rounds itself
    const icon = await browser.newPage({ viewport: { width: 180, height: 180 }, deviceScaleFactor: 1 });
    const svg = readFileSync(join(root, 'public/favicon.svg'), 'utf8').replace(/<style>.*?<\/style>/s, '<style>rect{fill:#0b0b0c}</style>');
    await icon.setContent(`<body style="margin:0;background:#fff"><div style="width:180px;height:180px;display:grid;place-items:center">${svg.replace('<svg ', '<svg width="132" height="132" ')}</div></body>`);
    const touch = join(root, 'public/apple-touch-icon.png');
    await icon.screenshot({ path: touch });
    console.log(`icon: public/apple-touch-icon.png ${kb(touch)}`);
    // favicon.ico at the root, which Apple's previewer and older browsers ask for whatever the page declares:
    // the same bars at 16, 32 and 48 px, each stored as a PNG inside the ICO
    const sizes = [16, 32, 48];
    const pngs: Buffer[] = [];
    for (const px of sizes) {
      const p = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
      const bars = svg.replace('<svg ', `<svg width="${px}" height="${px}" `);
      await p.setContent(`<body style="margin:0;background:#fff">${bars}</body>`);
      const f = join(tmpdir(), `favicon-${px}.png`);
      await p.screenshot({ path: f });
      pngs.push(readFileSync(f));
      rmSync(f);
    }
    const head = Buffer.alloc(6 + 16 * sizes.length);
    head.writeUInt16LE(0, 0);
    head.writeUInt16LE(1, 2);
    head.writeUInt16LE(sizes.length, 4);
    let offset = head.length;
    sizes.forEach((px, i) => {
      const e = 6 + 16 * i;
      head.writeUInt8(px, e);
      head.writeUInt8(px, e + 1);
      head.writeUInt16LE(1, e + 4);
      head.writeUInt16LE(32, e + 6);
      head.writeUInt32LE(pngs[i].length, e + 8);
      head.writeUInt32LE(offset, e + 12);
      offset += pngs[i].length;
    });
    const ico = join(root, 'public/favicon.ico');
    writeFileSync(ico, Buffer.concat([head, ...pngs]));
    console.log(`icon: public/favicon.ico ${kb(ico)}`);
  }
} finally {
  await browser.close();
  await server.stop();
}
