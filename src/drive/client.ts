import type { StoreDoc } from '../types';
import { isValidDoc } from '../store/schema';
import {
  FILE_ID_KEY,
  connectDrive,
  getAccessToken,
  getStoredFileId,
  hasClientId,
  setStoredFileId,
} from './gis';

const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let inFlight = false;
let queued: StoreDoc | null = null;
let onNeedPicker: (() => void) | null = null;

export function setNeedPickerHandler(fn: () => void) {
  onNeedPicker = fn;
}

async function authorizedFetch(url: string, init: RequestInit, retry = true): Promise<Response> {
  let token = await getAccessToken({ interactive: false });
  if (!token) throw new Error('no token');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  let res = await fetch(url, { ...init, headers });
  if (res.status === 401 && retry) {
    token = await getAccessToken({ interactive: false, force: true });
    if (!token) return res;
    headers.set('Authorization', `Bearer ${token}`);
    res = await fetch(url, { ...init, headers });
  }
  return res;
}

export async function pullRemoteDoc(): Promise<StoreDoc | null> {
  if (!hasClientId()) return null;
  const fileId = getStoredFileId();
  if (!fileId) return null;
  const token = await getAccessToken({ interactive: false });
  if (!token) return null;
  try {
    const res = await authorizedFetch(`${API}/${encodeURIComponent(fileId)}?alt=media`, {
      method: 'GET',
    });
    if (res.status === 403 || res.status === 404) {
      onNeedPicker?.();
      return null;
    }
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (isValidDoc(json)) return json;
  } catch {
    return null;
  }
  return null;
}

export async function pushRemoteDoc(doc: StoreDoc): Promise<void> {
  if (!hasClientId()) return;
  const fileId = getStoredFileId();
  if (!fileId) return;
  const token = await getAccessToken({ interactive: false });
  if (!token) return;

  const metadata = { mimeType: 'application/json', name: 'scriptor.json' };
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([JSON.stringify(doc)], { type: 'application/json' }));

  const res = await authorizedFetch(
    `${UPLOAD}/${encodeURIComponent(fileId)}?uploadType=multipart`,
    { method: 'PATCH', body: form },
  );
  if (res.status === 403 || res.status === 404) {
    onNeedPicker?.();
  }
}

export function scheduleDrivePush(doc: StoreDoc) {
  if (!hasClientId()) return;
  queued = doc;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void flushPush();
  }, 1500);
}

async function flushPush() {
  if (inFlight) return;
  const next = queued;
  queued = null;
  if (!next) return;
  inFlight = true;
  try {
    await pushRemoteDoc(next);
  } catch {
    /* ignore */
  } finally {
    inFlight = false;
    if (queued) void flushPush();
  }
}

export async function pickDriveFile(): Promise<string | null> {
  if (!hasClientId()) return null;
  const token = await getAccessToken({ interactive: true });
  if (!token) return null;
  const id = window.prompt('ID do arquivo no Drive (files.update, sem criar):', getStoredFileId());
  if (id && id.trim()) {
    setStoredFileId(id.trim());
    return id.trim();
  }
  return localStorage.getItem(FILE_ID_KEY);
}

export { connectDrive, hasClientId };
