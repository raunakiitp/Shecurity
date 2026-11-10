// Shared types for Shecurity

export type Sensitivity = 'low' | 'medium' | 'high';

export type TriggerType =
  | 'scream'
  | 'keyword'
  | 'dual'
  | 'manual'
  | 'shake'
  | 'triple-tap'
  | 'shift'
  | 'countdown';

export interface Contact {
  id: string;
  name: string;
  relation: string;
  phone: string; // digits with country code, e.g. 919876543210
  email?: string;
  primary: boolean;
}

export interface Settings {
  sensitivity: Sensitivity;
  siren: boolean;
  vibration: boolean;
  keywords: boolean;
  lang: 'hi-IN' | 'en-IN';
  unlockCode: string; // e.g. "1234="
  watchIntervalMin: number;
}

export interface GeoSnap {
  lat: number;
  lng: number;
  accuracy: number;
  at: string;
}

export interface ClipMeta {
  id: string;
  createdAt: string; // ISO
  localTime: string;
  duration: number; // seconds
  trigger: TriggerType;
  peakScore: number; // 0..1
  location?: GeoSnap;
  device: string;
  sha256: string;
  duress?: boolean;
  note?: string;
  fileName: string;
}

export interface ClipRecord {
  meta: ClipMeta;
  wav: ArrayBuffer;
}

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  iterations: number;
  createdAt: string;
  pinHash?: string;
  pinSalt?: string;
  pinHashIterations?: number;
  duressHash?: string;
  duressSalt?: string;
  duressHashIterations?: number;
  contacts: Contact[];
  settings: Settings;
  onboarded: boolean;
}

export type Session = { userId: string; token: string; at: string };

export interface AlertHistoryEntry {
  id: string;
  at: string;
  trigger: TriggerType;
  outcome: 'cancelled' | 'silent-duress' | 'proceeded' | 'resolved';
  location?: GeoSnap;
  contactsNotified: number;
  clipId?: string;
}

// Detection
export interface YamnetProbs {
  scores: Float32Array; // 521
  top: { idx: number; name: string; score: number }[];
  screamScore: number; // weighted 0..1
  raw: number;
}

export type DangerZone = 'safe' | 'watch' | 'danger';

export const THRESHOLDS: Record<Sensitivity, number> = {
  low: 0.6,
  medium: 0.45,
  high: 0.3,
};
