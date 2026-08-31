import { openDB, type DBSchema } from 'idb';
import type { ShareInboxItem } from '../types';

interface ShareDB extends DBSchema {
  inbox: {
    key: number;
    value: ShareInboxItem & { id?: number };
  };
}

const DB_NAME = 'scriptor-share';
const STORE = 'inbox';

async function db() {
  return openDB<ShareDB>(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function pushShareInbox(item: ShareInboxItem): Promise<void> {
  const database = await db();
  await database.add(STORE, item);
}

export async function takeShareInbox(): Promise<ShareInboxItem | null> {
  const database = await db();
  const tx = database.transaction(STORE, 'readwrite');
  const all = await tx.store.getAll();
  if (!all.length) {
    await tx.done;
    return null;
  }
  const first = all[0];
  if (first.id != null) await tx.store.delete(first.id);
  for (const extra of all.slice(1)) {
    if (extra.id != null) await tx.store.delete(extra.id);
  }
  await tx.done;
  const { id: _id, ...rest } = first;
  return rest;
}

export async function peekShareInbox(): Promise<boolean> {
  const database = await db();
  const count = await database.count(STORE);
  return count > 0;
}
