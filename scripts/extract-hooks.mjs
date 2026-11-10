// move useToast out of Bits.tsx and passwordStrength out of Field.tsx
// (react-refresh: component files should only export components)
import fs from 'node:fs';

// --- Bits.tsx: extract useToast ---
let bits = fs.readFileSync('src/components/ui/Bits.tsx', 'utf8');
const toastHook = `export function useToast() {
  const [toast, setToast] = useState<{ message: string; tone: 'teal' | 'coral' } | null>(null);
  const show = (message: string, tone: 'teal' | 'coral' = 'teal') => {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2600);
  };
  return { toast, show };
}`;
if (bits.includes(toastHook)) {
  bits = bits.split(toastHook + '\n\n').join('').split(toastHook).join('');
  // keep useState import if still needed elsewhere
  if (!/useState[< (]/.test(bits.replace("import { useState, type ReactNode } from 'react';", ''))) {
    bits = bits.replace("import { useState, type ReactNode } from 'react';", "import type { ReactNode } from 'react';");
  }
  fs.writeFileSync('src/components/ui/Bits.tsx', bits);
  fs.writeFileSync(
    'src/components/ui/useToast.ts',
    `import { useState } from 'react';

export type ToastTone = 'teal' | 'coral';

${toastHook.replace("tone?: 'teal' | 'coral' } | null>(null);", "tone?: ToastTone } | null>(null);").replace("(message: string, tone: 'teal' | 'coral' = 'teal')", '(message: string, tone: ToastTone = \'teal\')')}
`,
  );
  console.log('useToast extracted');
} else {
  console.log('useToast pattern not found in Bits.tsx');
}

// --- Field.tsx: extract passwordStrength ---
let field = fs.readFileSync('src/components/ui/Field.tsx', 'utf8');
const strengthFn = field.match(/export function passwordStrength[\s\S]*?\n\}/);
if (strengthFn) {
  field = field.split(strengthFn[0] + '\n').join('').split(strengthFn[0]).join('');
  fs.writeFileSync('src/components/ui/Field.tsx', field);
  fs.writeFileSync(
    'src/components/ui/passwordStrength.ts',
    `export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
}

${strengthFn[0].replace('export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string; color: string } {', 'export function passwordStrength(pw: string): PasswordStrength {')}
`,
  );
  console.log('passwordStrength extracted');
} else {
  console.log('passwordStrength pattern not found');
}
