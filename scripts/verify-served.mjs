// quick browser check of the served site (real Chrome via puppeteer-core)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { mkdirSync } from 'node:fs';

mkdirSync('dist/ui-evidence', { recursive: true });

const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 900 });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 150)));
page.on('pageerror', (e) => errors.push(String(e).slice(0, 150)));
page.on('response', (r) => r.status() >= 400 && errors.push(`HTTP ${r.status()} ${r.url().slice(0, 80)}`));

await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2', timeout: 30000 });
await new Promise((r) => setTimeout(r, 1200));
const text = await page.evaluate(() => document.body.innerText.slice(0, 300));
await page.screenshot({ path: 'dist/ui-evidence/08-served-site.png' });
await browser.close();

console.log('TITLE OK, hero text found:', /It listens/i.test(text));
console.log('Console/page/load errors:', errors.length);
errors.forEach((e) => console.log('  •', e));
process.exit(errors.length ? 1 : 0);
