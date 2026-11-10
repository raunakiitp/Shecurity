// Fix all post-extraction type errors:
// 1. re-point useShecurity imports at shecurity-context
// 2. re-add AlertPhase import in provider
// 3. fix emit-handler typing with typed listeners
// 4. yamnetWorker null-guard
// 5. Vault Button import back
import fs from 'node:fs';

function patch(f, pairs, { optional = false } = {}) {
  let t = fs.readFileSync(f, 'utf8');
  const before = t;
  for (const [a, b] of pairs) {
    if (!t.includes(a)) {
      console.log('  (miss)', f, JSON.stringify(a.slice(0, 60)));
      continue;
    }
    t = t.split(a).join(b);
  }
  if (t !== before) fs.writeFileSync(f, t);
  console.log('patched', f);
}

// 1. useShecurity lives in shecurity-context now
for (const f of [
  'src/app/router.tsx',
  'src/pages/AlertScreen.tsx',
  'src/pages/Calculator.tsx',
  'src/pages/Contacts.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/Demo.tsx',
  'src/pages/Login.tsx',
  'src/pages/Onboarding.tsx',
  'src/pages/Settings.tsx',
  'src/pages/Signup.tsx',
  'src/components/dashboard/MonitorPanel.tsx',
  'src/components/dashboard/VerificationCard.tsx',
  'src/components/layout/AppLayout.tsx',
]) {
  let t = fs.readFileSync(f, 'utf8');
  const before = t;
  // split provider import: provider keeps only the component
  t = t.replace(
    /import \{([^}]*)ShecurityProvider([^}]*)\} from '(\.\.?\/(?:\.\/)?(?:app\/)?)ShecurityProvider';/,
    (all, before2, after2, path) => {
      const names = (before2 + after2)
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && s !== 'useShecurity');
      const prov = `import { ShecurityProvider${names.length ? `, ${names.join(', ')}` : ''} } from '${path}ShecurityProvider';`;
      const ctxPath = path.replace(/ShecurityProvider$/, 'shecurity-context');
      const hook = `import { useShecurity } from '${ctxPath}';`;
      return prov + '\n' + hook;
    },
  );
  // imports that reference ONLY useShecurity from provider
  t = t.split("import { useShecurity } from '../app/ShecurityProvider';").join("import { useShecurity } from '../app/shecurity-context';");
  t = t.split("import { useShecurity } from '../../app/ShecurityProvider';").join("import { useShecurity } from '../../app/shecurity-context';");
  if (t !== before) fs.writeFileSync(f, t);
}

// 2. AlertPhase import in provider
patch('src/app/ShecurityProvider.tsx', [
  [
    "import {\n  ShecurityContext,\n  PRE_ROLL_SEC,\n  POST_ROLL_SEC,\n  type ShecurityContextValue,\n} from './shecurity-context';",
    "import {\n  ShecurityContext,\n  PRE_ROLL_SEC,\n  POST_ROLL_SEC,\n  type ShecurityContextValue,\n  type AlertPhase,\n} from './shecurity-context';",
  ],
]);

// 3. typed listeners instead of (...args: unknown[])
patch('src/engine/audio/AudioEngine.ts', [
  ['private handlers: Partial<Record<keyof AudioEngineEvents, Set<(...args: unknown[]) => void>>> = {};', 'private handlers: { [K in keyof AudioEngineEvents]?: Set<AudioEngineEvents[K]> } = {};'],
  [
    "  on<K extends keyof AudioEngineEvents>(evt: K, fn: AudioEngineEvents[K]) {\n    (this.handlers[evt] ||= new Set()).add(fn);\n    return () => this.handlers[evt]?.delete(fn);\n  }",
    "  on<K extends keyof AudioEngineEvents>(evt: K, fn: AudioEngineEvents[K]) {\n    const set = (this.handlers[evt] ||= new Set()) as Set<AudioEngineEvents[K]>;\n    set.add(fn);\n    return () => set.delete(fn);\n  }",
  ],
  [
    "  private emit(evt: keyof AudioEngineEvents, ...args: unknown[]) {\n    this.handlers[evt]?.forEach((fn) => (fn as (...args: unknown[]) => void)(...args));\n  }",
    "  private emit<K extends keyof AudioEngineEvents>(evt: K, ...args: Parameters<AudioEngineEvents[K]>) {\n    this.handlers[evt]?.forEach((fn) => (fn as (...a: unknown[]) => void)(...args));\n  }",
  ],
]);
patch('src/engine/detection/DetectionEngine.ts', [
  ['private handlers: Record<string, Set<(...args: unknown[]) => void>> = {};', 'type DetEvt = { ema: number; raw: number; top3: { name: string; score: number }[] } | { score: number; source: string } | string;\n  private handlers: Record<string, Set<(payload: never) => void>> = {};'],
  ["on(evt: 'score' | 'trigger' | 'ready' | 'error', fn: (...args: unknown[]) => void) {\n    (this.handlers[evt] ||= new Set()).add(fn);\n    return () => this.handlers[evt]?.delete(fn);\n  }", "on(evt: 'score' | 'trigger' | 'ready' | 'error', fn: (payload?: unknown) => void) {\n    (this.handlers[evt] ||= new Set()).add(fn);\n    return () => this.handlers[evt]?.delete(fn);\n  }"],
  ['private emit(evt: string, ...args: unknown[]) {\n    this.handlers[evt]?.forEach((f) => f(...args));\n  }', 'private emit(evt: string, ...args: unknown[]) {\n    this.handlers[evt]?.forEach((f) => f(args[0]));\n  }'],
]);
patch('src/engine/detection/KeywordEngine.ts', [
  ["on(evt: 'keyword' | 'error' | 'state', fn: (...args: unknown[]) => void) {\n    (this.handlers[evt] ||= new Set()).add(fn);\n    return () => this.handlers[evt]?.delete(fn);\n  }", "on(evt: 'keyword' | 'error' | 'state', fn: (payload?: unknown) => void) {\n    (this.handlers[evt] ||= new Set()).add(fn);\n    return () => this.handlers[evt]?.delete(fn);\n  }"],
  ['private emit(evt: string, ...args: unknown[]) {\n    this.handlers[evt]?.forEach((f) => f(...args));\n  }', 'private emit(evt: string, ...args: unknown[]) {\n    this.handlers[evt]?.forEach((f) => f(args[0]));\n  }'],
]);

// 4. yamnetWorker null guards
patch('src/engine/detection/yamnetWorker.ts', [
  [
    '  let scores: tf.Tensor;\n  try {\n    scores = model.predict(input) as tf.Tensor;\n  } catch {\n    scores = model.execute(input) as tf.Tensor;\n  }',
    '  if (!model) throw new Error("YAMNet model not loaded");\n  let scores: tf.Tensor;\n  try {\n    scores = model.predict(input) as tf.Tensor;\n  } catch {\n    scores = model.execute(input) as tf.Tensor;\n  }',
  ],
]);

// 5. Vault needs Button back (it was used in the delete Modal)
patch('src/pages/Vault.tsx', [
  ["import { Badge, Modal, Toast } from '../components/ui/Bits';", "import { Badge, Modal, Toast } from '../components/ui/Bits';\nimport { Button } from '../components/ui/Button';"],
  ["import { Badge, Modal, useToast, Toast } from '../components/ui/Bits';", "import { Badge, Modal, Toast } from '../components/ui/Bits';\nimport { useToast } from '../components/ui/useToast';\nimport { Button } from '../components/ui/Button';"],
]);

// 6. VerificationCard Chip: keep ok prop in signature usage
patch('src/components/dashboard/VerificationCard.tsx', [
  ['function Chip({ active, label }: { active: boolean; label: string }) {', 'function Chip({ active, label }: { active: boolean; label: string; ok?: boolean }) {'],
]);

// 7. implicit-any params flagged after context change
patch('src/pages/AlertScreen.tsx', [["submitPin(next).then((res) => {", "submitPin(next).then((res: 'real' | 'duress' | 'none') => {"]]);
patch('src/pages/Contacts.tsx', [["const next = contacts.filter((c) => c.id !== id);", "const next = contacts.filter((c: Contact) => c.id !== id);"]]);

console.log('all patches applied');
