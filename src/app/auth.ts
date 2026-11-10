// AuthService: users in localStorage, PBKDF2-hashed passwords, session tokens
import type { Contact, Settings, StoredUser } from '../lib/types';
import { hashSecret, verifySecret } from '../engine/crypto/secrets';
import {
  findUserByEmail,
  getSession,
  getUser,
  setSession,
  upsertUser,
} from '../engine/storage/localStore';
import { uid } from '../lib/format';

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 'medium',
  siren: true,
  vibration: true,
  keywords: false,
  lang: 'hi-IN',
  unlockCode: '1234=',
  watchIntervalMin: 2,
};

export const DEMO_USER_EMAIL = 'demo@shecurity.app';
const DEMO_PASSWORD = 'shecurity-demo-2026';

function demoContacts(): Contact[] {
  return [
    { id: uid(), name: 'Aarti (Mom)', relation: 'Mother', phone: '919810012345', primary: true },
    { id: uid(), name: 'Neha Sharma', relation: 'Friend', phone: '919820034567', primary: false },
    { id: uid(), name: 'Rohit (Brother)', relation: 'Brother', phone: '919830045678', primary: false },
  ];
}

async function createOrGetDemoUser(): Promise<StoredUser> {
  const existing = findUserByEmail(DEMO_USER_EMAIL);
  if (existing) return existing;
  const { hash, salt, iterations } = await hashSecret(DEMO_PASSWORD);
  const user: StoredUser = {
    id: uid(),
    name: 'Demo User',
    email: DEMO_USER_EMAIL,
    passwordHash: hash,
    salt,
    iterations,
    createdAt: new Date().toISOString(),
    contacts: demoContacts(),
    settings: { ...DEFAULT_SETTINGS },
    onboarded: true,
  };
  upsertUser(user);
  return user;
}

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (findUserByEmail(email)) return { ok: false, error: 'An account with this email already exists on this device.' };
  const { hash, salt, iterations } = await hashSecret(password);
  const user: StoredUser = {
    id: uid(),
    name,
    email,
    passwordHash: hash,
    salt,
    iterations,
    createdAt: new Date().toISOString(),
    contacts: [],
    settings: { ...DEFAULT_SETTINGS },
    onboarded: false,
  };
  upsertUser(user);
  return { ok: true };
}

export async function login(
  email: string,
  password: string,
  remember: boolean,
): Promise<{ ok: true; user: StoredUser } | { ok: false; error: string }> {
  const user = findUserByEmail(email);
  if (!user) return { ok: false, error: 'No account found with this email on this device.' };
  const valid = await verifySecret(password, user.passwordHash, user.salt, user.iterations);
  if (!valid) return { ok: false, error: 'Incorrect password.' };
  startSession(user, remember);
  return { ok: true, user };
}

export async function continueAsDemo(): Promise<StoredUser> {
  const user = await createOrGetDemoUser();
  startSession(user, true);
  return user;
}

export function startSession(user: StoredUser, remember: boolean) {
  setSession({ userId: user.id, token: uid(), at: new Date().toISOString() });
  if (!remember) {
    // note: demo builds keep session in localStorage either way; sessionStorage
    // differentiation documented in brain.md as a v2 nicety.
  }
}

export function currentUser(): StoredUser | null {
  const s = getSession();
  if (!s) return null;
  return getUser(s.userId) || null;
}

export function logout() {
  setSession(null);
}

export function updateUser(user: StoredUser) {
  upsertUser(user);
}

export async function setPins(
  userId: string,
  realPin: string,
  duressPin: string,
): Promise<void> {
  const user = getUser(userId);
  if (!user) throw new Error('User not found');
  const real = await hashSecret(realPin);
  const duress = await hashSecret(duressPin);
  user.pinHash = real.hash;
  user.pinSalt = real.salt;
  user.pinHashIterations = real.iterations;
  user.duressHash = duress.hash;
  user.duressSalt = duress.salt;
  user.duressHashIterations = duress.iterations;
  upsertUser(user);
}

export async function verifyPin(
  userId: string,
  pin: string,
): Promise<'real' | 'duress' | 'none'> {
  const user = getUser(userId);
  if (!user?.pinHash || !user.pinSalt) return 'none';
  if (await verifySecret(pin, user.pinHash, user.pinSalt, user.pinHashIterations ?? 150000)) return 'real';
  if (user.duressHash && user.duressSalt && (await verifySecret(pin, user.duressHash, user.duressSalt, user.duressHashIterations ?? 150000)))
    return 'duress';
  return 'none';
}
