// Optimize docs/screenshots: resize max width 1200, convert to WebP (quality 80)
// using Chrome's canvas — no native image deps required.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'docs/screenshots';
const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.png'));
for (const f of files) {
  const full = path.join(DIR, f);
  const b64 = fs.readFileSync(full).toString('base64');
  const out = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await new Promise((res) => (img.onload = res));
    const maxW = 1200;
    const scale = Math.min(1, maxW / img.width);
    const w = Math.round(img.width * scale);
    const h = Math.round(img.height * scale);
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(img, 0, 0, w, h);
    const webp = c.toDataURL('image/webp', 80);
    const png = c.toDataURL('image/png');
    return { webp, png, w, h };
  }, b64);
  const name = f.replace(/\.png$/, '');
  const webpBuf = Buffer.from(out.webp.split(',')[1], 'base64');
  const pngBuf = Buffer.from(out.png.split(',')[1], 'base64');
  // keep the smaller of the two as the shipped format
  if (webpBuf.length < pngBuf.length) {
    fs.writeFileSync(path.join(DIR, name + '.webp'), webpBuf);
    fs.unlinkSync(full);
    console.log(`${name}: png ${(b64.length * 0.75 / 1024).toFixed(0)}KB → webp ${(webpBuf.length / 1024).toFixed(0)}KB (${out.w}x${out.h})`);
  } else {
    fs.writeFileSync(path.join(DIR, name + '.opt.png'), pngBuf);
    fs.unlinkSync(full);
    fs.renameSync(path.join(DIR, name + '.opt.png'), full);
    console.log(`${name}: optimized png ${(pngBuf.length / 1024).toFixed(0)}KB (${out.w}x${out.h})`);
  }
}
await browser.close();
console.log('\nFinal:', fs.readdirSync(DIR).join(', '));
