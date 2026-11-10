// IndexedDB for audio evidence clips ("shecurity" → "clips").
// Migrates the legacy "echo-blackbox" database once so existing clips survive the rename.
import type { ClipMeta, ClipRecord } from '../../lib/types';

const DB_NAME = 'shecurity';
const LEGACY_DB_NAME = 'echo-blackbox';
const STORE = 'clips';
export const MAX_CLIPS = 20;

let dbPromise: Promise<IDBDatabase> | null = null;

function openNamed(name: string, version = 1): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'meta.id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

function txNamed<T>(db: IDBDatabase, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * One-time migration: copy every clip record from the legacy "echo-blackbox"
 * database into "shecurity", then delete the legacy database.
 * Safe to run repeatedly: it no-ops when the legacy DB is absent or empty,
 * and never overwrites records that already exist in the new DB.
 */
async function migrateLegacyDB(): Promise<void> {
  try {
    // databases() is unavailable in some older browsers — fall through to try/catch open
    if (typeof indexedDB.databases === 'function') {
      const dbs = await indexedDB.databases();
      if (!dbs.some((d) => d.name === LEGACY_DB_NAME)) return;
    }
    let legacy: IDBDatabase;
    try {
      legacy = await openNamed(LEGACY_DB_NAME, 1);
    } catch {
      return; // nothing to migrate
    }
    const records = await txNamed<ClipRecord[]>(legacy, 'readonly', (store) => store.getAll() as IDBRequest<ClipRecord[]>);
    legacy.close();
    if (records.length > 0) {
      const target = await openNamed(DB_NAME, 1);
      const existing = await txNamed<ClipRecord[]>(target, 'readonly', (store) => store.getAll() as IDBRequest<ClipRecord[]>);
      const known = new Set(existing.map((r) => r.meta.id));
      const fresh = records.filter((r) => !known.has(r.meta.id));
      if (fresh.length > 0) {
        await new Promise<void>((resolve, reject) => {
          const t = target.transaction(STORE, 'readwrite');
          for (const rec of fresh) t.objectStore(STORE).put(rec);
          t.oncomplete = () => resolve();
          t.onerror = () => reject(t.error);
        });
      }
      target.close();
    }
    // wrapped in its own try: delete can fail if another tab holds a connection
    try {
      indexedDB.deleteDatabase(LEGACY_DB_NAME);
    } catch {
      /* legacy db removed on next successful run */
    }
    if (records.length > 0) {
      console.info(`Shecurity: migrated ${records.length} evidence clip(s) from the legacy database.`);
    }
  } catch {
    /* migration is best-effort; the app continues with whatever is available */
  }
}

async function openDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      await migrateLegacyDB();
      return openNamed(DB_NAME, 1);
    })();
  }
  return dbPromise;
}

export async function saveClip(meta: ClipMeta, wav: ArrayBuffer): Promise<void> {
  await tx('readwrite', (store) => store.put({ meta, wav } as ClipRecord));
  await enforceCap();
}

export async function getClip(id: string): Promise<ClipRecord | undefined> {
  return tx<ClipRecord | undefined>('readonly', (store) => store.get(id) as IDBRequest<ClipRecord | undefined>);
}

export async function listClips(): Promise<ClipMeta[]> {
  const all = await tx<ClipRecord[]>('readonly', (store) => store.getAll() as IDBRequest<ClipRecord[]>);
  return all.map((r) => r.meta).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function deleteClip(id: string): Promise<void> {
  await tx('readwrite', (store) => store.delete(id) as unknown as IDBRequest<undefined>);
}

export async function clearClips(): Promise<void> {
  await tx('readwrite', (store) => store.clear() as unknown as IDBRequest<undefined>);
}

async function enforceCap() {
  const metas = await listClips();
  if (metas.length > MAX_CLIPS) {
    const extra = metas.slice(MAX_CLIPS);
    for (const m of extra) await deleteClip(m.id);
  }
}

export async function storageEstimate(): Promise<{ usage: number; quota: number } | null> {
  if (navigator.storage?.estimate) {
    const est = await navigator.storage.estimate();
    return { usage: est.usage || 0, quota: est.quota || 0 };
  }
  return null;
}
