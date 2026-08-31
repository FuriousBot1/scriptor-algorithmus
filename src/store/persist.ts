import { openDB, type DBSchema } from 'idb';
import type { StoreDoc } from '../types';
import { isValidDoc } from './schema';
import { seedDoc } from './seed';

interface ScriptorDB extends DBSchema {
  kv: {
    key: string;
    value: StoreDoc;
  };
}

const IDB_NAME = 'scriptor';
const IDB_STORE = 'kv';
const IDB_KEY = 'doc';
const LS_KEY = 'scriptor.notes';

let hydrated = false;
let bootPromise: Promise<StoreDoc> | null = null;

export function isHydrated(): boolean {
  return hydrated;
}

async function openKv() {
  return openDB<ScriptorDB>(IDB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    },
  });
}

async function loadFromIdb(): Promise<StoreDoc | null> {
  try {
    const db = await openKv();
    const doc = await db.get(IDB_STORE, IDB_KEY);
    if (isValidDoc(doc)) return doc;
  } catch {
    /* ignore */
  }
  return null;
}

function loadFromLs(): StoreDoc | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const doc = JSON.parse(raw) as unknown;
    if (isValidDoc(doc)) return doc;
  } catch {
    /* ignore */
  }
  return null;
}

async function persistNow(doc: StoreDoc): Promise<void> {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(doc));
  } catch {
    /* ignore quota */
  }
  try {
    const db = await openKv();
    await db.put(IDB_STORE, doc, IDB_KEY);
  } catch {
    /* ignore */
  }
}

export async function saveDoc(doc: StoreDoc): Promise<void> {
  if (!hydrated) return;
  await persistNow(doc);
}

export async function hydrate(): Promise<StoreDoc> {
  if (bootPromise) return bootPromise;
  bootPromise = (async () => {
    const existing = (await loadFromIdb()) ?? loadFromLs();
    if (existing) {
      hydrated = true;
      return existing;
    }
    const seeded = seedDoc();
    hydrated = true;
    await persistNow(seeded);
    return seeded;
  })();
  return bootPromise;
}
