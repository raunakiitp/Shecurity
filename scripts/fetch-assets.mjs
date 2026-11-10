// Downloads royalty-free assets into public/:
//  - public/sounds/ — a short "scream-like" demo sample (Pixabay / free CC0 sources)
//  - public/images/ — royalty-free Unsplash photos (women commuting, walking, calculator)
//  - public/icons/  — PWA icons generated from an inline SVG (no external deps)
// All downloads are best-effort: if a source is unreachable we fall back to
// locally generated SVG illustrations so no image box is ever empty.
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'public', 'images');
const SND = path.join(ROOT, 'public', 'sounds');
const ICO = path.join(ROOT, 'public', 'icons');

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 ShecurityBuild' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 1024) throw new Error(`Too small (${buf.length}B): ${url}`);
  await writeFile(dest, buf);
  console.log(`✓ ${path.relative(ROOT, dest)} (${(buf.length / 1024).toFixed(0)} KB)`);
  return true;
}

async function tryDownload(url, dest) {
  try {
    await download(url, dest);
    return true;
  } catch (e) {
    console.warn(`✗ ${url} → ${e.message}`);
    return false;
  }
}

// ---------- Sounds ----------
// Pixabay audio (CC0-like license). These are stable CDN links.
const SOUND_SOURCES = [
  {
    file: 'sample-scream.mp3',
    urls: [
      'https://cdn.pixabay.com/audio/2022/03/10/audio_2c367a67e0.mp3',
      'https://cdn.pixabay.com/audio/2023/06/14/audio_2c1d4d4e92.mp3',
    ],
    credit: 'Female scream sample — Pixabay (pixabay.com), free to use under the Pixabay Content License.',
  },
];

// ---------- Images (Unsplash direct CDN, royalty-free under the Unsplash License) ----------
const IMAGE_SOURCES = [
  {
    file: 'hero-night-commute.webp',
    urls: ['https://images.unsplash.com/photo-1520881363902-a0ff4e722963?w=1200&q=75&fm=webp&fit=crop'],
    alt: 'A woman waiting at a bus stop at dusk, city lights behind her',
    credit: 'Photo by Erik Eastman on Unsplash',
  },
  {
    file: 'walking-city-street.webp',
    urls: ['https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1000&q=75&fm=webp&fit=crop'],
    alt: 'A person walking down a city street in the evening',
    credit: 'Photo by red xu on Unsplash',
  },
  {
    file: 'auto-ride.webp',
    urls: ['https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=1000&q=75&fm=webp&fit=crop'],
    alt: 'A three-wheeler auto rickshaw on a busy Indian street',
    credit: 'Photo by Tom Rumble on Unsplash',
  },
  {
    file: 'phone-in-hand.webp',
    urls: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1000&q=75&fm=webp&fit=crop'],
    alt: 'A smartphone held in one hand',
    credit: 'Photo by Neil Soni on Unsplash',
  },
  {
    file: 'friends-support.webp',
    urls: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1000&q=75&fm=webp&fit=crop'],
    alt: 'A group of friends walking together, arms linked',
    credit: 'Photo by Priscilla Du Preez on Unsplash',
  },
  {
    file: 'calculator-desk.webp',
    urls: ['https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=1000&q=75&fm=webp&fit=crop'],
    alt: 'A calculator lying on a study desk',
    credit: 'Photo by Mufid Majnun on Unsplash',
  },
];

// ---------- SVG fallbacks (calm, flat, palette-consistent) ----------
function svgHero() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#14213D"/>
  <circle cx="620" cy="140" r="90" fill="#1F2E4D"/>
  <circle cx="620" cy="140" r="55" fill="#1F7A6D"/>
  <rect x="90" y="120" width="360" height="380" rx="24" fill="#1F2E4D"/>
  <rect x="120" y="150" width="300" height="70" rx="8" fill="#EDE7DB"/>
  <g fill="#2A9D8F">
    <rect x="120" y="250" width="60" height="40" rx="8"/><rect x="195" y="250" width="60" height="40" rx="8"/>
    <rect x="270" y="250" width="60" height="40" rx="8"/><rect x="345" y="250" width="75" height="40" rx="8" fill="#E9A23B"/>
    <rect x="120" y="310" width="60" height="40" rx="8"/><rect x="195" y="310" width="60" height="40" rx="8"/>
    <rect x="270" y="310" width="60" height="40" rx="8"/><rect x="345" y="310" width="75" height="40" rx="8" fill="#E9A23B"/>
    <rect x="120" y="370" width="135" height="40" rx="8"/><rect x="270" y="370" width="150" height="40" rx="8" fill="#D1495B"/>
  </g>
  <text x="400" y="560" font-family="Georgia" font-size="20" fill="#F7F4EE" text-anchor="middle">It listens before you have to call.</text>
</svg>`;
}

function svgSection(i) {
  const palettes = [
    ['#1F7A6D', '#EDE7DB'],
    ['#D1495B', '#F7F4EE'],
    ['#E9A23B', '#14213D'],
    ['#2A9D8F', '#1F2E4D'],
  ];
  const [a, b] = palettes[i % palettes.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
  <rect width="640" height="420" rx="20" fill="${b}"/>
  <circle cx="480" cy="110" r="70" fill="${a}" opacity="0.85"/>
  <rect x="60" y="90" width="300" height="240" rx="16" fill="${a}" opacity="0.35"/>
  <path d="M80 300 Q160 240 240 290 T420 260" stroke="${a}" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="140" cy="200" r="14" fill="${a}"/>
  <circle cx="220" cy="170" r="14" fill="${a}" opacity="0.7"/>
  <rect x="60" y="350" width="180" height="12" rx="6" fill="${a}"/>
</svg>`;
}

async function writeFallbacks() {
  await writeFile(path.join(IMG, 'hero-fallback.svg'), svgHero());
  for (let i = 0; i < 6; i++) {
    await writeFile(path.join(IMG, `section-${i + 1}.svg`), svgSection(i));
  }
  console.log('✓ SVG fallback illustrations written');
}

async function main() {
  await Promise.all([mkdir(IMG, { recursive: true }), mkdir(SND, { recursive: true }), mkdir(ICO, { recursive: true })]);

  // sounds
  for (const s of SOUND_SOURCES) {
    let ok = false;
    for (const u of s.urls) {
      ok = await tryDownload(u, path.join(SND, s.file));
      if (ok) break;
    }
    if (!ok) {
      // generate a short synthetic "scream-like" sweep as a WAV fallback so the demo always works
      const wav = synthScreamWav();
      await writeFile(path.join(SND, 'sample-scream.wav'), wav);
      console.log('✓ public/sounds/sample-scream.wav (synthesized fallback — sweep + noise burst)');
      await writeFile(
        path.join(SND, 'CREDITS.md'),
        `# Sound credits\n\n- sample-scream.wav — SYNTHETIC FALLBACK generated by scripts/fetch-assets.mjs (a rising formant-like sweep, safe for demo). Replace with a royalty-free scream (e.g. Pixabay "scream" — Pixabay Content License) for production use.\n`,
      );
    } else {
      await writeFile(path.join(SND, 'CREDITS.md'), `# Sound credits\n\n- ${s.file} — ${s.credit}\n`);
    }
  }

  // images
  let downloaded = 0;
  for (const img of IMAGE_SOURCES) {
    const ok = await tryDownload(img.urls[0], path.join(IMG, img.file));
    if (ok) downloaded++;
  }
  if (downloaded < 3) {
    console.warn('Few images downloaded — writing SVG fallbacks.');
    await writeFallbacks();
  }

  // icons: render the favicon SVG to PNG via a tiny pure-JS approach is heavy;
  // instead ship the SVG as the icon source and generate simple PNGs with node-canvas-free method:
  // we write a minimal valid PNG manually (solid ink square) as maskable base.
  await writePngIcons();

  // credits file
  const credits = [
    '# Image & sound credits',
    '',
    '## Photos (Unsplash License — free to use)',
    ...IMAGE_SOURCES.filter(() => true).map((i) => `- ${i.file} — ${i.credit} · source: ${i.urls[0]}`),
    '',
    '## Illustrations',
    '- hero-fallback.svg, section-*.svg — original flat illustrations made for Shecurity (no license restrictions).',
    '',
    '## Sound',
    '- See public/sounds/CREDITS.md',
    '',
  ].join('\n');
  await writeFile(path.join(IMG, 'CREDITS.md'), credits);
  console.log('✓ public/images/CREDITS.md');
}

// Minimal PNG writer for solid-color icons (no deps)
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
crc32.table = null;

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

async function writePngIcons() {
  // simple two-tone icon: ink bg, teal rounded square, cream dot — as raw RGBA
  const sizes = [192, 512];
  for (const size of sizes) {
    const { PNG } = await import('pngjs').catch(() => ({ PNG: null }));
    if (!PNG) {
      // pngjs not installed — write SVG icons instead and reference them in the manifest
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
        <rect width="64" height="64" rx="14" fill="#14213D"/>
        <rect x="10" y="12" width="44" height="16" rx="3" fill="#EDE7DB"/>
        <g fill="#2A9D8F">
          <rect x="10" y="34" width="9" height="7" rx="2"/><rect x="23" y="34" width="9" height="7" rx="2"/>
          <rect x="36" y="34" width="9" height="7" rx="2"/><rect x="10" y="45" width="9" height="7" rx="2"/>
          <rect x="23" y="45" width="9" height="7" rx="2"/><rect x="36" y="45" width="18" height="7" rx="2"/>
        </g>
      </svg>`;
      await writeFile(path.join(ICO, `icon-${size}.svg`), svg);
      console.log(`✓ public/icons/icon-${size}.svg (PNG renderer unavailable; SVG icon written)`);
      continue;
    }
    const png = new PNG({ width: size, height: size });
    const ink = [0x14, 0x21, 0x3d, 0xff];
    const teal = [0x2a, 0x9d, 0x8f, 0xff];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (size * y + x) << 2;
        const inTeal = x > size * 0.2 && x < size * 0.8 && y > size * 0.25 && y < size * 0.75;
        const c = inTeal ? teal : ink;
        png.data[idx] = c[0];
        png.data[idx + 1] = c[1];
        png.data[idx + 2] = c[2];
        png.data[idx + 3] = c[3];
      }
    }
    await writeFile(path.join(ICO, `icon-${size}.png`), PNG.sync.write(png));
    console.log(`✓ public/icons/icon-${size}.png`);
  }
}

// Synthesized "scream-like" WAV: rising pitch sweep with vibrato + noise, 2.5s, 16k mono
function synthScreamWav() {
  const sr = 16000;
  const dur = 2.5;
  const n = Math.round(sr * dur);
  const data = new Int16Array(n);
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const env = Math.min(1, t / 0.08) * Math.exp(-Math.max(0, t - 1.6) * 2.2);
    const f = 420 + 520 * Math.min(1, t / 0.9) + 40 * Math.sin(2 * Math.PI * 5.5 * t);
    const vib = 1 + 0.03 * Math.sin(2 * Math.PI * 8 * t);
    const ph = 2 * Math.PI * f * vib * t;
    let s =
      0.55 * Math.sin(ph) +
      0.3 * Math.sin(2 * ph + 0.7) +
      0.15 * Math.sin(3 * ph + 1.3);
    s += 0.18 * (Math.random() * 2 - 1);
    lp = lp + 0.25 * (s - lp);
    data[i] = Math.max(-32767, Math.min(32767, Math.round(lp * env * 0.85 * 32767)));
  }
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) buf.writeInt16LE(data[i], 44 + i * 2);
  return buf;
}

main().catch((err) => {
  console.error('fetch-assets failed:', err.message);
  process.exit(1);
});
