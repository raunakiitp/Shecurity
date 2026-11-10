// serve-dist.mjs — zero-dependency static server for dist/ with SPA fallback.
// Serves the built Shecurity app on any port; survives without vite.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.bin': 'application/octet-stream',
  '.csv': 'text/csv; charset=utf-8',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
};

async function resolveFile(urlPath) {
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const full = join(ROOT, safe);
  if (!full.startsWith(ROOT)) return null; // path traversal guard
  try {
    const s = await stat(full);
    if (s.isFile()) return full;
    if (s.isDirectory()) {
      const idx = join(full, 'index.html');
      await stat(idx);
      return idx;
    }
  } catch {
    /* not found */
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = req.url.split('?')[0];
    let file = await resolveFile(urlPath);
    if (!file) file = join(ROOT, 'index.html'); // SPA fallback
    const data = await readFile(file);
    const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, {
      'content-type': type,
      'cache-control': file.includes('assets') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'access-control-allow-origin': '*',
    });
    res.end(data);
  } catch (e) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Internal error: ' + e.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Shecurity (production build) serving at http://localhost:${PORT}/  — Ctrl+C to stop`);
});
