/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { openDB } from 'idb';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();

async function blobToDataUrl(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  const type = blob.type || 'image/jpeg';
  return `data:${type};base64,${b64}`;
}

async function handleShare(request: Request): Promise<Response> {
  let title = '';
  let text = '';
  let url = '';
  let image: string | undefined;
  try {
    const fd = await request.formData();
    title = String(fd.get('title') || '');
    text = String(fd.get('text') || '');
    url = String(fd.get('url') || '');
    const files = fd.getAll('image').concat(fd.getAll('files'));
    for (const f of files) {
      if (f instanceof File && f.size && f.type.startsWith('image/')) {
        image = await blobToDataUrl(f);
        break;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const db = await openDB('scriptor-share', 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('inbox')) {
          database.createObjectStore('inbox', { keyPath: 'id', autoIncrement: true });
        }
      },
    });
    await db.add('inbox', { title, text, url, image });
  } catch {
    /* ignore */
  }

  const dest = new URL('./?share=1', self.registration.scope);
  return Response.redirect(dest.toString(), 303);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'POST') return;
  const path = new URL(req.url).pathname;
  if (path.endsWith('/share') || path.endsWith('/share/')) {
    event.respondWith(handleShare(req));
  }
});
