// Capture real product screenshots for the README into docs/screenshots/.
// Uses the running app (VERIFY_URL or the production build on :4173) in headless
// Chrome with fake mic so Monitoring can actually turn ON and YAMNet loads.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { mkdirSync } from 'node:fs';

const BASE = process.env.VERIFY_URL || 'http://localhost:4173';
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
if (!exe) { console.error('no browser found'); process.exit(2); }

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1.5 });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e).slice(0, 120)));

const settle = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (name) => page.screenshot({ path: `${OUT}/${name}.png` });

async function seedDemo() {
  await page.goto(BASE + '/demo', { waitUntil: 'networkidle2', timeout: 45000 });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /open dashboard/i.test(x.textContent || ''));
    b && b.click();
  });
  await settle(1500);
}

// 1) Landing
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 45000 });
await settle(1600);
await shot('landing');
console.log('✓ landing');

// 2) Calculator
await page.goto(BASE + '/calculator', { waitUntil: 'networkidle2' });
await settle(600);
await shot('calculator');
console.log('✓ calculator');

// 3) Dashboard with danger meter (monitoring ON, YAMNet loaded)
await seedDemo();
await settle(600);
// flip monitoring ON via the toggle
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button[role="switch"]')][0];
  t && t.click();
});
// wait for the model to load + meter to animate
await settle(12000);
await shot('dashboard-danger-meter');
console.log('✓ dashboard-danger-meter');

// 4) Alert countdown — trigger via SOS hold is gesture-based; use the provider by
//    clicking the SOS button and holding via CDP is complex; instead emulate a
//    keyword+scream is timing-based. Simplest reliable path: dispatch Shift x3 hotkey? also timing.
//    We use the public path: triple-press Shift on desktop fires 'shift' trigger.
await page.keyboard.down('Shift'); await page.keyboard.up('Shift'); await settle(120);
await page.keyboard.down('Shift'); await page.keyboard.up('Shift'); await settle(120);
await page.keyboard.down('Shift'); await page.keyboard.up('Shift');
await settle(1500);
const urlAfter = page.url();
if (urlAfter.includes('/alert')) {
  await shot('alert-countdown');
  console.log('✓ alert-countdown');
  // dismiss back to a clean state: enter real PIN 1234 to cancel
  const digits = ['1', '2', '3', '4'];
  for (const d of digits) {
    await page.evaluate((dd) => {
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.trim() === dd);
      b && b.click();
    }, d);
    await settle(250);
  }
  await settle(1000);
} else {
  console.log('⚠ alert screen did not open (got', urlAfter + ') — skipping shot, no broken link will be added');
}

// 5) Vault (empty state is still informative)
await page.goto(BASE + '/vault', { waitUntil: 'networkidle2' });
await settle(900);
await shot('vault');
console.log('✓ vault');

// 6) Verify page
await page.goto(BASE + '/verify', { waitUntil: 'networkidle2' });
await settle(800);
await shot('verify-page');
console.log('✓ verify-page');

// 7) Share/location panel — visible inside the alert flow 'sharing' phase; also the
//    onboarding share diagram. We capture the alert screen sharing section by
//    triggering a countdown and letting it expire is slow; instead reuse alert screen
//    if reachable. Fallback: skip (no broken link).
//    Try: SOS hold via CDP mouse events on the SOS button (hold 1.6s).
await seedDemo();
const sos = await page.$('[data-testid="sos-button"]');
if (sos) {
  const box = await sos.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await settle(1700);
    await page.mouse.up();
    await settle(1200);
    if (page.url().includes('/alert')) {
      // countdown screen — capture as share-location only if we can reach sharing;
      // capture countdown first if not already captured
      const haveCountdown = fs.existsSync(`${OUT}/alert-countdown.png`);
      if (!haveCountdown) {
        await shot('alert-countdown');
        console.log('✓ alert-countdown (via SOS hold)');
      }
      // let countdown expire (10s) → proceeds to recording/sharing panel
      await settle(11500);
      if (page.url().includes('/alert')) {
        await shot('share-location');
        console.log('✓ share-location (alert sharing panel)');
        // leave via Done button
        await page.evaluate(() => {
          const b = [...document.querySelectorAll('button')].find((x) => /back to dashboard/i.test(x.textContent || ''));
          b && b.click();
        });
        await settle(600);
      }
    }
  }
}

// 8) Mobile 375px — landing + dashboard
await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2 });
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await settle(1400);
await shot('mobile-view');
console.log('✓ mobile-view');

await browser.close();
console.log('\nErrors during capture:', errors.length);
errors.forEach((e) => console.log(' •', e));
const files = fs.readdirSync(OUT).filter((f) => f.endsWith('.png'));
console.log('\nCaptured:', files.join(', '));
