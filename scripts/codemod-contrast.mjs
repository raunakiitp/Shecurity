// TASK2 contrast codemod: replace low-opacity paper text on dark surfaces with
// the mist/steel tokens. Marketing pages (Landing) are intentionally untouched.
import fs from 'node:fs';

const files = [
  'src/pages/Contacts.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Onboarding.tsx',
  'src/pages/Settings.tsx',
  'src/pages/Vault.tsx',
  'src/components/dashboard/MonitorPanel.tsx',
  'src/components/dashboard/VerificationCard.tsx',
  'src/components/dashboard/DangerMeter.tsx',
];

// ordered replacements (most specific first)
const pairs = [
  // icons / quiet affordances → steel (AA for graphics/placeholder)
  ['text-paper/40', 'text-steel'],
  // secondary body text → mist
  ['text-paper/50', 'text-mist'],
  ['text-paper/60', 'text-mist'],
  ['text-paper/70', 'text-mist'],
  // dark borders
  ['border-white/10', 'border-lineDark/50'],
  ['border-white/15', 'border-lineDark'],
  ['border-white/20', 'border-lineDark'],
  ['border-dashed border-white/15', 'border-dashed border-lineDark'],
];

let count = 0;
for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const before = t;
  for (const [a, b] of pairs) t = t.split(a).join(b);
  if (t !== before) {
    fs.writeFileSync(f, t);
    count++;
    console.log('updated', f);
  }
}
console.log('files updated:', count);
