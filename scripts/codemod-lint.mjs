// lint warning cleanup: unused imports/vars flagged by eslint
import fs from 'node:fs';

const edits = [
  // ShecurityProvider: unused import + unused state setter
  [
    'src/app/ShecurityProvider.tsx',
    [
      ['import type {\n  AlertHistoryEntry,\n  ClipMeta,', 'import type {\n  ClipMeta,'],
      ['const [kwHit, setKwHit] = useState<string | null>(null);', 'const [kwHit] = useState<string | null>(null);'],
      ["lastHit: kwHit,", 'lastHit: kwHit,'],
    ],
  ],
  // MonitorPanel: unused useEffect
  ['src/components/dashboard/MonitorPanel.tsx', [["import { useEffect, useState } from 'react';", "import { useState } from 'react';"]]],
  // VerificationCard: unused imports/args
  [
    'src/components/dashboard/VerificationCard.tsx',
    [
      ["import { useEffect, useRef, useState } from 'react';", "import { useRef, useState } from 'react';"],
      ['import { ShieldCheck, ShieldAlert, Siren, Hand, Copy, MapPin } from \'lucide-react\';', 'import { ShieldCheck, ShieldAlert, Siren, Hand } from \'lucide-react\';'],
      ["import { formatDuration } from '../../lib/format';\n", ''],
      ['function Chip({ active, label, ok }: { active: boolean; label: string; ok: boolean }) {', 'function Chip({ active, label }: { active: boolean; label: string }) {'],
      ['      {active ? \'✓\' : \'✖\'}', '      {active ? \'✓\' : \'✖\'}'],
    ],
  ],
  // AppLayout: unused Mic
  ['src/components/layout/AppLayout.tsx', [['  Mic,\n', '']]],
  // share.ts: unused Contact
  ['src/engine/location/share.ts', [["import type { Contact, GeoSnap } from '../../lib/types';", "import type { GeoSnap } from '../../lib/types';"]]],
  // pdf.ts: unused formatDateTime
  ['src/engine/storage/pdf.ts', [["import { formatDateTime, mapsLink } from '../../lib/format';", "import { mapsLink } from '../../lib/format';"]]],
  // AlertScreen: unused imports
  [
    'src/pages/AlertScreen.tsx',
    [
      ["import { AnimatePresence, motion } from 'framer-motion';", "import { motion } from 'framer-motion';"],
      ['import { Check, Delete, MapPin, Phone, Send, ShieldCheck, Users, Volume2, VolumeX, RefreshCw, Copy } from \'lucide-react\';', 'import { Check, Delete, MapPin, Send, ShieldCheck, Users, Volume2, VolumeX, RefreshCw, Copy } from \'lucide-react\';'],
      ["import { Badge } from '../components/ui/Bits';\n", ''],
    ],
  ],
  // Calculator: unused KEYS + Btn
  [
    'src/pages/Calculator.tsx',
    [
      ["const KEYS: Key[][] = [\n  ['C', '( )', '%', '÷'],\n  ['7', '8', '9', '×'],\n  ['4', '5', '6', '−'],\n  ['1', '2', '3', '+'],\n  ['±', '0', '.', '='],\n];\n\n", ''],
    ],
  ],
  // Dashboard: unused imports/vars
  [
    'src/pages/Dashboard.tsx',
    [
      ["import { Info, MapPin, ShieldQuestion } from 'lucide-react';", "import { Info } from 'lucide-react';"],
      ['  const {\n    user,\n    monitoring,', '  const {\n    monitoring,'],
    ],
  ],
  // HowItWorks: unused ShieldCheck
  ['src/pages/HowItWorks.tsx', [['import { ShieldCheck, ShieldAlert, Siren, Hand, Copy, MapPin } from \'lucide-react\';', '']]],
  // Settings: unused Smartphone
  ['src/pages/Settings.tsx', [['  Smartphone,\n', '']]],
  // Signup: unused Info
  ['src/pages/Signup.tsx', [['import { Info, ShieldCheck } from \'lucide-react\';', "import { ShieldCheck } from 'lucide-react';"]]],
  // VerifyEvidence: unused Button
  ['src/pages/VerifyEvidence.tsx', [["import { Button } from '../components/ui/Button';\n", '']]],
];

for (const [f, pairs] of edits) {
  let t = fs.readFileSync(f, 'utf8');
  for (const [a, b] of pairs) {
    if (!t.includes(a)) {
      console.log('MISS', f, JSON.stringify(a.slice(0, 50)));
      continue;
    }
    t = t.split(a).join(b);
  }
  fs.writeFileSync(f, t);
  console.log('ok', f);
}
