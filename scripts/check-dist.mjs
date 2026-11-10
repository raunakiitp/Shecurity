// checks dist output: fonts self-hosted, no external font hosts referenced
import { readFileSync, readdirSync } from 'node:fs';
const html = readFileSync('dist/index.html', 'utf8');
console.log('index.html font refs:', html.match(/fonts[^"']*/g));
console.log('any googleapis/gstatic in index.html:', /googleapis|gstatic/.test(html));
console.log('dist/fonts files:', readdirSync('dist/fonts').join(', '));
