// Rewire ShecurityProvider to import context/hook from shecurity-context.ts
// (react-refresh: a file should only export components).
import fs from 'node:fs';

const f = 'src/app/ShecurityProvider.tsx';
let t = fs.readFileSync(f, 'utf8');

// 1. imports: drop createContext/useContext, add the shared module
t = t.replace(
  /import \{\n  createContext,\n  useCallback,\n  useContext,\n  useEffect,\n  useRef,\n  useState,\n  type ReactNode,\n\} from 'react';/,
  "import {\n  useCallback,\n  useEffect,\n  useRef,\n  useState,\n  type ReactNode,\n} from 'react';\nimport {\n  ShecurityContext,\n  PRE_ROLL_SEC,\n  POST_ROLL_SEC,\n  type ShecurityContextValue,\n} from './shecurity-context';",
);

// 2. remove the local exports of the hook/constants/type
t = t.replace(/export type AlertPhase = [^\n]+\n/, '');
t = t.replace(/const ShecurityContext = createContext<ShecurityContextValue \| null>\(null\);\n\n/, '');
t = t.replace(/export function useShecurity\(\): ShecurityContextValue \{[\s\S]*?\n\}\n\n/, '');
t = t.replace(/export const PRE_ROLL_SEC = 30;\nexport const POST_ROLL_SEC = 30;\n/, '');
// drop the local interface (now imported)
t = t.replace(/interface ShecurityContextValue extends EngineSnapshot \{[\s\S]*?\n\}\n\n/, '');
// ensure the component keeps the same name
t = t.replace(/export function ShecurityProvider\(/, 'export function ShecurityProvider(');

fs.writeFileSync(f, t);
console.log('ShecurityProvider rewired');
