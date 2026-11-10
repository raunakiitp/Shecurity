// scripts/fetch-fonts.mjs — self-host Fraunces + Inter.
// Downloads the css2 stylesheet and every woff2 it references into public/fonts/,
// rewriting the CSS to point at local files. Removes the runtime dependency on
// fonts.googleapis.com / fonts.gstatic.com (offline demos, sandboxes, privacy).
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'public', 'fonts');
const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

async function main() {
  await mkdir(OUT, { recursive: true });
  const cssRes = await fetch(CSS_URL, { headers: { 'user-agent': UA } });
  if (!cssRes.ok) throw new Error(`css2 HTTP ${cssRes.status}`);
  let css = await cssRes.text();

  // collect unique gstatic urls
  const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g) || [])];
  console.log(`Found ${urls.length} woff2 files referenced`);

  let i = 0;
  const rename = new Map();
  for (const url of urls) {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    // derive a stable local name: <family>-<n>.woff2 preserving order
    const fam = /family=([A-Za-z]+)/.exec(CSS_URL) ? '' : '';
    const isFraunces = /Fraunces/i.test(css.slice(Math.max(0, css.indexOf(url) - 400), css.indexOf(url)));
    const name = `${isFraunces ? 'fraunces' : 'inter'}-${String(i).padStart(2, '0')}.woff2`;
    await writeFile(path.join(OUT, name), buf);
    rename.set(url, `/fonts/${name}`);
    console.log(`✓ public/fonts/${name} (${(buf.length / 1024).toFixed(1)} KB)`);
    i++;
  }

  for (const [remote, local] of rename) css = css.split(remote).join(local);
  await writeFile(path.join(OUT, 'fonts.css'), css);
  console.log(`✓ public/fonts/fonts.css (${urls.length} faces rewritten to /fonts/… — zero external requests)`);
}

main().catch((e) => {
  console.error('fetch-fonts failed:', e.message);
  process.exit(1);
});
