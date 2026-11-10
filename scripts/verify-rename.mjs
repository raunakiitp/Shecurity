// Case-insensitive "echo" sweep over the whole repo (excludes node_modules, .git, dist).
// The YAMNet class-map CSV legitimately contains AudioSet class 506 "Echo" (model data, not branding).
// Reports every hit with file:line so nothing is left behind.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', '.vite']);
const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full);
    else {
      let content;
      try {
        content = readFileSync(full, 'utf8');
      } catch {
        continue; // binary
      }
      const lines = content.split(/\r?\n/);
      lines.forEach((line, i) => {
        if (/echo/i.test(line)) hits.push({ ref: `${full.replace(ROOT + '\\', '').replace(/\\/g, '/')}:${i + 1}`, line });
      });
    }
  }
}

walk(ROOT);
console.log(`TOTAL HITS: ${hits.length}`);
hits.forEach((h) => console.log(`${h.ref}: ${h.line.trim().slice(0, 160)}`));

// classify
const SELF = /verify-rename\.mjs/;
const INTENTIONAL = /migrat|legacy|echoCancellation|yamnet_class_map|formerly Echo Black Box|Black Box era|echo-blackbox|echo_users|echo_session|echo_alert_history|echo_\*|sweep over the whole repo|\/echo\/i|01jnbd/i;
const unexpected = hits.filter((h) => !SELF.test(h.ref) && !INTENTIONAL.test(h.line));
console.log(`\nIntentional (migration/API/model-data/self) hits: ${hits.length - unexpected.length}`);
console.log(`UNEXPECTED HITS: ${unexpected.length}`);
unexpected.forEach((h) => console.log('  LEFTOVER:', h.ref, h.line.trim().slice(0, 120)));
process.exit(unexpected.length === 0 ? 0 : 1);
