// Render the README's mermaid block with the real mermaid parser (headless Chrome).
// Confirms the diagram is syntactically valid before it hits GitHub.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const md = fs.readFileSync('README.md', 'utf8');
const block = md.match(/```mermaid\n([\s\S]*?)```/);
if (!block) { console.error('no mermaid block'); process.exit(1); }
const diagram = block[1];

const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();

const html = `<!doctype html><html><body>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  window.renderResult = async (src) => {
    try {
      mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
      const { svg } = await mermaid.render('g1', src);
      return { ok: true, len: svg.length };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  };
  window.__ready = true;
</script></body></html>`;

fs.writeFileSync('mermaid-test.html', html);
await page.goto('file://' + process.cwd().replace(/\\/g, '/') + '/mermaid-test.html', { waitUntil: 'networkidle0', timeout: 60000 });
await page.waitForFunction('window.__ready === true', { timeout: 30000 });
const result = await page.evaluate((src) => window.renderResult(src), diagram);
fs.unlinkSync('mermaid-test.html');

if (result.ok) {
  console.log('Mermaid renders OK (svg ' + result.len + ' chars)');
} else {
  console.log('MERMAID ERROR:', result.error);
}
await browser.close();
process.exit(result.ok ? 0 : 1);
