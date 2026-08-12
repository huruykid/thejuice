/**
 * Renders the PWA / home-screen icon set from the source logo.
 *
 * Why this exists: the source logo is a transparent PNG that bleeds to the edges.
 * That is wrong for two of the three places an icon lands:
 *   - iOS "Add to Home Screen" composites transparency onto BLACK, so a transparent
 *     apple-touch-icon ships a black tile.
 *   - Android adaptive icons crop to a circle/squircle and only guarantee the middle
 *     ~80%, so a maskable icon needs a filled background and real padding or the
 *     glass gets its edges shaved off.
 * The "any" icons keep the logo large; the maskable ones sit inside the safe zone.
 *
 * Run: node scripts/generate-pwa-icons.mjs
 * Regenerate whenever public/lovable-uploads/<the logo>.png changes.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(root, 'public/lovable-uploads/cf8e88b6-e6aa-4e2a-b0da-abdcf3e4641f.png');
const OUT_DIR = path.join(root, 'public/icons');

// Matches --background in src/index.css. The logo is orange on nothing; white is
// what it is designed to sit on everywhere else in the product.
const BACKGROUND = '#ffffff';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
].filter(Boolean);

const chrome = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error('No Chromium binary found. Set CHROME_PATH and retry.');
  process.exit(1);
}

/** @type {{name: string, size: number, scale: number, radius: number}[]} */
const TARGETS = [
  // purpose: any — logo close to the edge, transparent-safe surfaces show the white tile.
  { name: 'icon-192.png', size: 192, scale: 0.86, radius: 0 },
  { name: 'icon-512.png', size: 512, scale: 0.86, radius: 0 },
  // purpose: maskable — everything meaningful inside the middle 80% safe zone.
  { name: 'maskable-192.png', size: 192, scale: 0.6, radius: 0 },
  { name: 'maskable-512.png', size: 512, scale: 0.6, radius: 0 },
  // iOS home screen. Opaque, and iOS applies its own corner rounding.
  { name: 'apple-touch-icon.png', size: 180, scale: 0.78, radius: 0 },
];

const logoDataUri = `data:image/png;base64,${readFileSync(SOURCE).toString('base64')}`;

mkdirSync(OUT_DIR, { recursive: true });
const work = path.join(tmpdir(), `juice-icons-${process.pid}`);
mkdirSync(work, { recursive: true });

for (const target of TARGETS) {
  const html = `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;width:${target.size}px;height:${target.size}px;}
    body{background:${BACKGROUND};display:flex;align-items:center;justify-content:center;
         border-radius:${target.radius}px;overflow:hidden;}
    img{width:${Math.round(target.size * target.scale)}px;height:auto;display:block;}
  </style><img src="${logoDataUri}" alt="">`;

  const htmlPath = path.join(work, `${target.name}.html`);
  writeFileSync(htmlPath, html);

  execFileSync(
    chrome,
    [
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${target.size},${target.size}`,
      `--screenshot=${path.join(OUT_DIR, target.name)}`,
      `file://${htmlPath}`,
    ],
    { stdio: 'pipe' }
  );

  const written = readFileSync(path.join(OUT_DIR, target.name));
  const w = written.readUInt32BE(16);
  const h = written.readUInt32BE(20);
  if (w !== target.size || h !== target.size) {
    throw new Error(`${target.name}: expected ${target.size}px square, got ${w}x${h}`);
  }
  console.log(`${target.name.padEnd(24)} ${w}x${h}  ${(written.length / 1024).toFixed(1)}KB`);
}

rmSync(work, { recursive: true, force: true });
