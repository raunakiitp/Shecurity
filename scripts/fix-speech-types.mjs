// type the Web Speech event handlers (removes `any` warnings)
import fs from 'node:fs';

const f = 'src/engine/detection/KeywordEngine.ts';
let t = fs.readFileSync(f, 'utf8');

t = t.split('onresult: ((e: any) => void) | null;').join('onresult: ((e: SpeechRecognitionEventLike) => void) | null;');
t = t.split('onerror: ((e: any) => void) | null;').join('onerror: ((e: { error: string }) => void) | null;');
t = t.split('rec.onresult = (e: any) => {').join('rec.onresult = (e: SpeechRecognitionEventLike) => {');
t = t.split('rec.onerror = (e: any) => {').join('rec.onerror = (e: { error: string }) => {');

// insert the event-like interface before the first interface declaration
const iface = [
  'interface SpeechRecognitionAlternativeLike {',
  '  transcript: string;',
  '}',
  'interface SpeechRecognitionResultLike {',
  '  readonly length: number;',
  '  [index: number]: SpeechRecognitionAlternativeLike;',
  '  isFinal: boolean;',
  '}',
  'interface SpeechRecognitionEventLike {',
  '  readonly resultIndex: number;',
  '  readonly results: { readonly length: number; [index: number]: SpeechRecognitionResultLike };',
  '}',
  '',
].join('\n');

if (!t.includes('SpeechRecognitionEventLike {')) {
  t = t.replace('interface ', iface + 'interface ');
}

fs.writeFileSync(f, t);
console.log('KeywordEngine event types added');
