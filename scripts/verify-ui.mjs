// scripts/verify-ui.mjs — loads the real app in a real Chromium (Edge/Chrome),
// collects the console + page errors, inspects the DOM of key routes, and
// saves screenshots. Evidence for the "UI loaded + no console errors" checks.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const BASE = process.env.VERIFY_URL || 'http://localhost:4173';
const SHOTS = 'dist/ui-evidence';
fs.mkdirSync(SHOTS, { recursive: true });

const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((p) => fs.existsSync(p));
if (!exe) {
  console.error('NO_BROWSER: no Chrome/Edge executable found');
  process.exit(2);
}

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1366, height: 900 });

const consoleErrors = [];
const consoleWarnings = [];
const pageErrors = [];
const failedRequests = [];

page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error') consoleErrors.push(text.slice(0, 300));
  else if (msg.type() === 'warning') consoleWarnings.push(text.slice(0, 200));
});
page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 300)));
page.on('requestfailed', (req) => failedRequests.push(`${req.url().slice(0, 90)} → ${req.failure()?.errorText}`));
page.on('response', (res) => {
  if (res.status() >= 400) failedRequests.push(`${res.url().slice(0, 90)} → HTTP ${res.status()}`);
});

async function settle(ms = 900) {
  await new Promise((r) => setTimeout(r, ms));
}

const report = [];

// 1) Landing
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 30000 });
await settle(1200);
const landingText = await page.evaluate(() => document.body.innerText.slice(0, 400));
report.push(['Landing', {
  title: await page.title(),
  heroVisible: /It listens/i.test(landingText),
  ctaCount: await page.$$eval('a[href]', (as) => as.length),
}]);
await page.screenshot({ path: `${SHOTS}/01-landing.png` });

// 2) Demo → creates demo user, opens calculator
await page.goto(BASE + '/demo', { waitUntil: 'networkidle2' });
await settle(800);
await page.screenshot({ path: `${SHOTS}/02-demo.png` });
const calcBtn = await page.$$eval('button', (bs) => bs.map((b) => b.textContent?.trim()));
report.push(['Demo', { buttons: calcBtn.slice(0, 6) }]);

// click "Open calculator"
const clickedCalc = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /open calculator/i.test(x.textContent || ''));
  if (b) { b.click(); return true; }
  return false;
});
await settle(1000);
const calcUrl = page.url();
const calcDisplay = await page.evaluate(() => document.querySelector('[data-testid="calc-display"]')?.textContent ?? '(missing)');
report.push(['Calculator', { clickedCalc, url: calcUrl, display: calcDisplay }]);
await page.screenshot({ path: `${SHOTS}/03-calculator.png` });

// 3) do real math 7.5+3= then secret code 1234=
const press = async (label) => {
  await page.evaluate((l) => {
    const b = [...document.querySelectorAll('button[aria-label]')].find((x) => x.getAttribute('aria-label') === l);
    if (b) b.click();
  }, label);
  await settle(90);
};
for (const k of ['7', 'Decimal point', '5', 'Add', '3', 'Equals']) await press(k);
await settle(200);
const mathResult = await page.evaluate(() => document.querySelector('[data-testid="calc-display"]')?.textContent);
report.push(['Calculator math', { expression: '7.5+3=', result: mathResult }]);

for (const k of ['Clear', '1', '2', '3', '4', 'Equals']) await press(k);
await settle(1100);
const dashUrl = page.url();
const dashTitle = await page.title();
report.push(['Secret unlock 1234=', { url: dashUrl, title: dashTitle }]);

// 4) Dashboard DOM
await settle(800);
const dashText = await page.evaluate(() => document.body.innerText.slice(0, 700));
report.push(['Dashboard', {
  unlockedNotice: /Unlocked/i.test(dashText),
  dangerMeter: /Live danger meter/i.test(dashText),
  dualVerification: /Dual verification/i.test(dashText),
  sos: /SOS/i.test(dashText),
  testSound: /Test with sound/i.test(dashText),
  privacyLine: /processed on your device/i.test(dashText),
}]);
await page.screenshot({ path: `${SHOTS}/04-dashboard.png` });

// 5) panic Lock back to calculator
const lockClicked = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => /lock/i.test(x.textContent || ''));
  if (b) { b.click(); return true; }
  return false;
});
await settle(900);
report.push(['Panic Lock', { clicked: lockClicked, url: page.url(), title: await page.title() }]);

// 6) Vault + Verify pages render
await page.goto(BASE + '/vault', { waitUntil: 'networkidle2' });
await settle(700);
const vaultText = await page.evaluate(() => document.body.innerText.slice(0, 300));
report.push(['Vault', { heading: /Evidence Vault/i.test(vaultText), emptyState: /No evidence clips yet/i.test(vaultText) }]);
await page.screenshot({ path: `${SHOTS}/05-vault.png` });

await page.goto(BASE + '/verify', { waitUntil: 'networkidle2' });
await settle(700);
const verifyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
report.push(['Verify', { heading: /Verify evidence/i.test(verifyText), dropzone: /Drag & drop/i.test(verifyText) }]);
await page.screenshot({ path: `${SHOTS}/06-verify.png` });

// 7) mobile viewport spot-check (375px)
await page.setViewport({ width: 375, height: 812 });
await page.goto(BASE + '/', { waitUntil: 'networkidle2' });
await settle(800);
const hasHorizScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
report.push(['Mobile 375px', { horizontalOverflow: hasHorizScroll }]);
await page.screenshot({ path: `${SHOTS}/07-mobile-landing.png` });

await browser.close();

// ---- summary ----
console.log('\n=== DOM EVIDENCE ===');
for (const [name, data] of report) console.log(name + ':', JSON.stringify(data));
console.log('\n=== CONSOLE ERRORS ===', consoleErrors.length);
consoleErrors.forEach((e) => console.log('  •', e));
console.log('=== PAGE (uncaught) ERRORS ===', pageErrors.length);
pageErrors.forEach((e) => console.log('  •', e));
console.log('=== FAILED REQUESTS (excl. external fonts) ===');
failedRequests.filter((r) => !/fonts\.gstatic|fonts\.googleapis/.test(r)).forEach((r) => console.log('  •', r));
console.log('=== WARNINGS (non-error, informational) ===');
[...new Set(consoleWarnings)].slice(0, 5).forEach((w) => console.log('  •', w));

const fatal = consoleErrors.filter((e) => !/Download the React DevTools/i.test(e));
fs.writeFileSync(`${SHOTS}/summary.json`, JSON.stringify({ report, consoleErrors, pageErrors, failedRequests }, null, 2));
console.log(`\nScreenshots + summary.json written to ${SHOTS}/`);
console.log(fatal.length === 0 && pageErrors.length === 0 ? 'RESULT: PASS — no console errors' : 'RESULT: FAIL');
process.exit(fatal.length === 0 && pageErrors.length === 0 ? 0 : 1);
