// localStorage helpers with shecurity_ prefix.
// Migrates legacy echo_* keys once so existing data is not lost.
import type { AlertHistoryEntry, Session, StoredUser } from '../../lib/types';

const USERS_KEY = 'shecurity_users';
const SESSION_KEY = 'shecurity_session';
const HISTORY_KEY = 'shecurity_alert_history';

// legacy → new pairs (Echo Black Box era)
const LEGACY_KEYS: [string, string][] = [
  ['echo_users', USERS_KEY],
  ['echo_session', SESSION_KEY],
  ['echo_alert_history', HISTORY_KEY],
];

let migrated = false;

/** Copy old echo_* localStorage data to shecurity_* keys, then remove the old keys. */
function migrateLegacyKeys() {
  if (migrated) return;
  migrated = true;
  try {
    for (const [legacyKey, newKey] of LEGACY_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy === null) continue;
      // never overwrite data already written under the new key
      if (localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, legacy);
      }
      localStorage.removeItem(legacyKey);
    }
  } catch {
    /* storage unavailable (private mode) — proceed with defaults */
  }
}

export function getUsers(): StoredUser[] {
  migrateLegacyKeys();
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') as StoredUser[];
  } catch {
    return [];
  }
}

export function saveUsers(users: StoredUser[]) {
  migrateLegacyKeys();
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function upsertUser(user: StoredUser) {
  const users = getUsers();
  const i = users.findIndex((u) => u.id === user.id);
  if (i >= 0) users[i] = user;
  else users.push(user);
  saveUsers(users);
}

export function getUser(id: string): StoredUser | undefined {
  return getUsers().find((u) => u.id === id);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  return getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function getSession(): Session | null {
  migrateLegacyKeys();
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') as Session | null;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null) {
  migrateLegacyKeys();
  if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  else localStorage.removeItem(SESSION_KEY);
}

export function getHistory(): AlertHistoryEntry[] {
  migrateLegacyKeys();
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as AlertHistoryEntry[];
  } catch {
    return [];
  }
}

export function addHistory(entry: AlertHistoryEntry) {
  const h = getHistory();
  h.unshift(entry);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 100)));
}

export function clearHistory() {
  migrateLegacyKeys();
  localStorage.removeItem(HISTORY_KEY);
}
