// useShecurity hook + constants — separate file so ShecurityProvider.tsx
// only exports a component (react-refresh requirement).
import { useContext, createContext } from 'react';
import type { GeoSnap, Settings, StoredUser, TriggerType } from '../lib/types';

export type AlertPhase = 'idle' | 'prompt' | 'countdown' | 'recording' | 'sharing' | 'done';

export interface ShecurityContextValue {
  user: StoredUser | null;
  settings: Settings | null;
  monitoring: boolean;
  score: number;
  raw: number;
  top3: { name: string; score: number }[];
  levels: number[];
  uptime: number;
  modelState: 'unloaded' | 'loading' | 'ready' | 'error';
  modelError: string | null;
  worklet: boolean;
  keyword: {
    supported: boolean;
    enabled: boolean;
    running: boolean;
    lastHeard: string;
    lastHit: string | null;
  };
  verification: {
    sound: boolean;
    words: boolean;
    confidence: number;
  };
  alertPhase: AlertPhase;
  promptDeadline: number | null;
  countdownEnd: number | null;
  recordingLeft: number | null;
  location: GeoSnap | null;
  sharing: boolean;
  onUserChanged: (u: StoredUser | null) => void;
  logout: () => void;
  saveSettings: (s: Partial<Settings>) => void;
  setMonitoring: (on: boolean) => Promise<void>;
  triggerAlert: (trigger: TriggerType) => void;
  answerSafe: () => void;
  submitPin: (pin: string) => Promise<'real' | 'duress' | 'none'>;
  dismissAlertUI: () => void;
  sendLocationUpdate: () => Promise<string>;
  requestLocation: () => Promise<GeoSnap | null>;
  testSound: () => void;
}

export const ShecurityContext = createContext<ShecurityContextValue | null>(null);

export function useShecurity(): ShecurityContextValue {
  const ctx = useContext(ShecurityContext);
  if (!ctx) throw new Error('useShecurity must be used within ShecurityProvider');
  return ctx;
}

export const PRE_ROLL_SEC = 30;
export const POST_ROLL_SEC = 30;
