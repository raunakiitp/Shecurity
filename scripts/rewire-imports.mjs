// rewire useToast / passwordStrength imports across the app
import fs from 'node:fs';

const files = [
  'src/pages/Onboarding.tsx',
  'src/pages/Contacts.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Vault.tsx',
  'src/pages/Settings.tsx',
  'src/pages/AlertScreen.tsx',
  'src/pages/Signup.tsx',
  'src/pages/Calculator.tsx',
  'src/pages/Demo.tsx',
];

for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const before = t;
  // any import of useToast from Bits → move to its own module
  const bitsImportRe = /import \{([^}]*)\} from '\.\.\/components\/ui\/Bits';/;
  const m = t.match(bitsImportRe);
  if (m && /useToast/.test(m[1])) {
    const names = m[1]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && s !== 'useToast');
    const bitsLine = names.length
      ? `import { ${names.join(', ')} } from '../components/ui/Bits';`
      : '';
    const toastLine = `import { useToast } from '../components/ui/useToast';`;
    t = t.replace(bitsImportRe, [bitsLine, toastLine].filter(Boolean).join('\n'));
  }
  // Signup: passwordStrength import
  t = t.split("import { Field, passwordStrength } from '../components/ui/Field';").join(
    "import { Field } from '../components/ui/Field';\nimport { passwordStrength } from '../components/ui/passwordStrength';",
  );
  if (t !== before) {
    fs.writeFileSync(f, t);
    console.log('rewired', f);
  }
}
console.log('done');
