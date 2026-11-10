// Validate README: image paths exist, link targets exist, mermaid block is well-formed.
import fs from 'node:fs';

const md = fs.readFileSync('README.md', 'utf8');
const problems = [];

// 1. relative image paths
const imgRe = /!\[[^\]]*\]\(([^)]+)\)/g;
let m;
while ((m = imgRe.exec(md))) {
  const p = m[1];
  if (/^https?:/.test(p)) continue;
  if (!fs.existsSync(p)) problems.push('missing image: ' + p);
}

// 2. relative links
const linkRe = /(?<!\!)\[[^\]]*\]\(([^)]+)\)/g;
while ((m = linkRe.exec(md))) {
  const p = m[1];
  if (/^https?:|^#/.test(p)) continue;
  if (/^TODO_ADD_/.test(p)) continue; // deliberate placeholders
  if (!fs.existsSync(p)) problems.push('missing link target: ' + p);
}

// 3. mermaid block present + basic sanity
const mermaid = md.match(/```mermaid\n([\s\S]*?)```/);
if (!mermaid) problems.push('no mermaid block found');
else {
  const body = mermaid[1];
  if (!body.includes('flowchart')) problems.push('mermaid block missing flowchart declaration');
  if (/-->/.test(body) === false) problems.push('mermaid block has no edges');
  // unbalanced brackets in node labels are the common renderer break
  const opens = (body.match(/\[/g) || []).length;
  const closes = (body.match(/\]/g) || []).length;
  if (opens !== closes) problems.push(`mermaid brackets unbalanced: [=${opens} ]=${closes}`);
  const parensOpen = (body.match(/\(/g) || []).length;
  const parensClose = (body.match(/\)/g) || []).length;
  if (parensOpen !== parensClose) problems.push(`mermaid parens unbalanced: (=${parensOpen} )=${parensClose}`);
}

// 4. code fences balanced
const fences = (md.match(/```/g) || []).length;
if (fences % 2 !== 0) problems.push('unbalanced code fences');

// 5. tables: consistent pipe counts per table block
const lines = md.split('\n');
for (let i = 0; i < lines.length; i++) {
  if (/^\|/.test(lines[i]) && i + 1 < lines.length && /^\|[\s:-]+\|/.test(lines[i + 1])) {
    const cols = (lines[i].match(/\|/g) || []).length;
    let j = i + 2;
    while (j < lines.length && /^\|/.test(lines[j])) {
      if ((lines[j].match(/\|/g) || []).length !== cols) {
        problems.push(`table row ${j + 1} has different column count than header`);
        break;
      }
      j++;
    }
    i = j;
  }
}

// 6. placeholders inventory
const todos = [...new Set(md.match(/TODO_ADD_\w+/g) || [])];
console.log('TODO placeholders:', todos.length ? todos.join(', ') : '(none)');

if (problems.length) {
  console.log('\nPROBLEMS:');
  problems.forEach((p) => console.log(' ✗', p));
  process.exit(1);
}
console.log('\nREADME validation: PASS (images, links, mermaid, tables, fences all OK)');
