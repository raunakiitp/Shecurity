// scripts/verify-details.mjs — full-text DOM probes (no truncation)
import puppeteer from 'puppeteer-core';

const b = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--no-sandbox'],
});
const pg = await b.newPage();
const errors = [];
pg.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
pg.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));

await pg.goto('http://localhost:4173/demo', { waitUntil: 'networkidle2' });
await pg.evaluate(() => {
  const x = [...document.querySelectorAll('button')].find((y) => /open dashboard/i.test(y.textContent || ''));
  x && x.click();
});
await new Promise((r) => setTimeout(r, 1500));
const t = await pg.evaluate(() => document.body.innerText);
console.log('URL:', pg.url());
console.log('Dashboard full-text checks:');
console.log('  Dual verification:', /Dual verification/i.test(t));
console.log('  Manual SOS:', /Manual SOS/i.test(t));
console.log('  processed on your device:', /processed on your device/i.test(t));
console.log('  Alert history:', /Alert history/i.test(t));
console.log('  Live danger meter:', /Live danger meter/i.test(t));
console.log('  Hold 1.5 s hint:', /Hold 1\.5 s/i.test(t));

await pg.goto('http://localhost:4173/verify', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 600));
const v = await pg.evaluate(() => document.body.innerText);
console.log('Verify full-text checks:');
console.log('  Drag & drop zone:', /Drag & drop/i.test(v));
console.log('  Expected hash field:', /Expected SHA-256 hash/i.test(v));
console.log('  certutil instructions:', /certutil/i.test(v));

await pg.goto('http://localhost:4173/features', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 600));
const f = await pg.evaluate(() => document.body.innerText);
console.log('Features full-text checks:');
console.log('  9 sections (Stealth Calculator):', /Stealth Calculator/i.test(f));
console.log('  Duress PIN section:', /Duress PIN/i.test(f));
console.log('  Tamper-proof Evidence:', /Tamper-proof Evidence/i.test(f));

await pg.goto('http://localhost:4173/privacy', { waitUntil: 'networkidle2' });
await new Promise((r) => setTimeout(r, 600));
const pr = await pg.evaluate(() => document.body.innerText);
console.log('Privacy full-text checks:');
console.log('  Keyword disclosure:', /speech service/i.test(pr));
console.log('  Power button honesty:', /power button/i.test(pr));

console.log('\nConsole/page errors across all 4 routes:', errors.length);
errors.forEach((e) => console.log('  •', e));
await b.close();
process.exit(errors.length ? 1 : 0);
