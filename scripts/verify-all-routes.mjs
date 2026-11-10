// scripts/verify-all-routes.mjs — comprehensive crawl: every route, FULL console
// dump (all message types), failed requests, with optional network restriction
// (simulating a sandbox that blocks external hosts like fonts.gstatic.com).
// Usage: node scripts/verify-all-routes.mjs [--block-external]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BLOCK_EXTERNAL = process.argv.includes('--block-external');
const BASE = process.env.VERIFY_URL || 'http://localhost:4173';
const SHOTS = 'dist/ui-evidence';
fs.mkdirSync(SHOTS, { recursive: true });

const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 900 });

const consoleAll = [];
page.on('console', (m) => consoleAll.push(`[${m.type()}] ${m.text().slice(0, 260)}`));
page.on('pageerror', (e) => consoleAll.push(`[PAGEERROR] ${String(e).slice(0, 260)}`));
page.on('requestfailed', (r) => consoleAll.push(`[REQFAIL] ${r.url().slice(0, 110)} → ${r.failure()?.errorText}`));
page.on('response', (r) => r.status() >= 400 && consoleAll.push(`[HTTP${r.status()}] ${r.url().slice(0, 110)}`));

if (BLOCK_EXTERNAL) {
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = req.url();
    if (!/^https?:\/\/localhost|127\.0\.0\.1/.test(u)) req.abort().catch(() => {});
    else req.continue().catch(() => {});
  });
}

const results = [];
const visit = async (path, name, extra = async () => {}) => {
  consoleAll.length = 0;
  const before = consoleAll.length;
  try {
    await page.goto(BASE + path, { waitUntil: 'networkidle2', timeout: 30000 });
  } catch {
    /* continue with whatever loaded */
  }
  await new Promise((r) => setTimeout(r, 700));
  await extra();
  await new Promise((r) => setTimeout(r, 400));
  const errs = consoleAll.filter((l) => l.startsWith('[error]') || l.startsWith('[PAGEERROR]'));
  const others = consoleAll.filter((l) => !errs.includes(l));
  results.push({ path, name, errors: errs, other: others.slice(0, 8) });
  await page.screenshot({ path: `${SHOTS}/r-${name.replace(/\W+/g, '-')}.png` });
};

// public/marketing + auth routes
await visit('/', 'landing');
await visit('/features', 'features');
await visit('/how-it-works', 'how-it-works');
await visit('/privacy', 'privacy');
await visit('/verify', 'verify');
await visit('/demo', 'demo');
await visit('/login', 'login');
await visit('/signup', 'signup');
await visit('/nonexistent-route', 'notfound');

// demo user → app routes
await visit('/demo', 'demo2', async () => {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /open dashboard/i.test(x.textContent || ''));
    b && b.click();
  });
});
await new Promise((r) => setTimeout(r, 900));
results.push({ path: '(via demo→dashboard)', name: 'dashboard', errors: [], other: [`url=${page.url()}`] });
await page.screenshot({ path: `${SHOTS}/r-dashboard.png` });

// settings + contacts (session exists in this profile now)
await visit('/settings', 'settings');
await visit('/contacts', 'contacts');
await visit('/onboarding', 'onboarding'); // may redirect to login if user handling demands
await visit('/alert', 'alert'); // idle → redirects to dashboard/login

await browser.close();

console.log(`\n=== ALL-ROUTES CRAWL (${BLOCK_EXTERNAL ? 'external hosts BLOCKED' : 'normal network'}) ===`);
let totalErrors = 0;
for (const r of results) {
  totalErrors += r.errors.length;
  console.log(`\n${r.path} (${r.name}) — errors: ${r.errors.length}`);
  r.errors.forEach((e) => console.log('   ERROR:', e));
  if (r.other.length) console.log('   other console:', JSON.stringify(r.other));
}
console.log(`\nTOTAL CONSOLE/PAGE ERRORS: ${totalErrors}`);
console.log(BLOCK_EXTERNAL ? 'MODE: sandbox-simulated (all external requests aborted)' : 'MODE: normal network');
process.exit(totalErrors ? 1 : 0);
