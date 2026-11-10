// Replace the two regexes in normalizeSpeech with single-code-point classes
// built from String.fromCharCode so no combining-character sequences appear.
import fs from 'node:fs';

const f = 'src/lib/constants.ts';
let t = fs.readFileSync(f, 'utf8');

// old line 62: strip combining marks
const B1 = String.fromCharCode(47, 91, 92, 117, 48, 51, 48, 48, 45, 92, 117, 48, 51, 54, 102, 93, 47, 103);
// alternative: use property escape (supported since ES2018) — cleaner and rule-compliant
const A1 = '/\\p{M}/gu';

// old line 63: keep letters (a-z, Devanagari block, comma, whitespace)
const B2 = String.fromCharCode(47, 91, 94, 65, 45, 90, 97, 45, 122, 44, 92, 117, 48, 57, 48, 48, 45, 92, 117, 48, 57, 55, 70, 44, 92, 115, 93, 47, 103, 117);
// \p{L} covers a-z AND Devanagari letters; \p{M} covers marks removed on line 62
const A2 = '/[^\\p{L}\\s,]/gu';

let changed = 0;
if (t.includes(B1)) {
  t = t.split(B1).join(A1);
  changed++;
  console.log('combining-marks regex → \\p{M}/gu');
}
if (t.includes(B2)) {
  t = t.split(B2).join(A2);
  changed++;
  console.log('keep-letters regex → [^\\p{L}\\s,]/gu');
}
fs.writeFileSync(f, t);
console.log('replacements:', changed);
