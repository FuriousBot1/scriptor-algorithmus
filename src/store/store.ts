import { useSyncExternalStore } from 'react';
import type { ImageItem, Note, Page, StoreDoc } from '../types';
import { uniqueId } from '../lib/ids';
import { collectLinksAndImage } from '../lib/text';
import { ARCHIVE_ID, GERAL_ID } from './schema';
import { hydrate as persistHydrate, saveDoc } from './persist';
import { scheduleDrivePush } from '../drive/client';

let doc: StoreDoc | null = null;
const listeners = new Set<() => void>();
const lastSectionByPage = new Map<string, string>();

function emit() {
  for (const l of listeners) l();
}

function commit(next: StoreDoc) {
  doc = { ...next, updated: Date.now() };
  emit();
  void saveDoc(doc);
  scheduleDrivePush(doc);
}

function pageById(d: StoreDoc, id: string): Page | undefined {
  return d.pages.find((p) => p.id === id);
}

function ensureSection(page: Page, sectionId: string, title?: string): Page {
  if (page.sections.some((s) => s.id === sectionId)) return page;
  const id = sectionId || GERAL_ID;
  return {
    ...page,
    sections: [...page.sections, { id, title: title || id }],
  };
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSnapshot(): StoreDoc {
  if (!doc) throw new Error('store used before hydrate');
  return doc;
}

export function useDoc(): StoreDoc {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export async function hydrate(): Promise<StoreDoc> {
  if (doc) return doc;
  doc = await persistHydrate();
  return doc;
}

export function getLastSection(pageId: string): string {
  const d = getSnapshot();
  const page = pageById(d, pageId);
  const remembered = lastSectionByPage.get(pageId);
  if (remembered && page?.sections.some((s) => s.id === remembered)) return remembered;
  return page?.sections[0]?.id || GERAL_ID;
}

export function setLastSection(pageId: string, sectionId: string) {
  lastSectionByPage.set(pageId, sectionId);
}

export function setActivePage(id: string) {
  const d = getSnapshot();
  if (!d.pages.some((p) => p.id === id)) return;
  commit({ ...d, activePageId: id });
}

export function addPage(title: string): string {
  const d = getSnapshot();
  const id = uniqueId(title, d.pages.map((p) => p.id));
  const page: Page = {
    id,
    title: title.trim() || id,
    kind: 'page',
    sections: [{ id: GERAL_ID, title: GERAL_ID }],
    notes: [],
  };
  const pages = [...d.pages];
  const archIdx = pages.findIndex((p) => p.kind === 'archive' || p.id === ARCHIVE_ID);
  if (archIdx >= 0) pages.splice(archIdx, 0, page);
  else pages.push(page);
  commit({ ...d, pages, activePageId: id });
  return id;
}

export function renamePage(id: string, title: string) {
  const d = getSnapshot();
  commit({
    ...d,
    pages: d.pages.map((p) => (p.id === id ? { ...p, title } : p)),
  });
}

export function deletePage(id: string) {
  const d = getSnapshot();
  const page = pageById(d, id);
  if (!page || page.kind === 'archive' || page.id === ARCHIVE_ID) return;
  if (d.pages.filter((p) => p.kind !== 'archive').length <= 1) return;
  const pages = d.pages.filter((p) => p.id !== id);
  const activePageId = d.activePageId === id ? pages[0].id : d.activePageId;
  commit({ ...d, pages, activePageId });
}

export function addSection(pageId: string, title: string): string {
  const d = getSnapshot();
  const page = pageById(d, pageId);
  if (!page) return GERAL_ID;
  const id = uniqueId(title, page.sections.map((s) => s.id));
  const next: Page = {
    ...page,
    sections: [...page.sections, { id, title: title.trim() || id }],
  };
  commit({
    ...d,
    pages: d.pages.map((p) => (p.id === pageId ? next : p)),
  });
  setLastSection(pageId, id);
  return id;
}

export function addNote(
  pageId: string,
  sectionId: string,
  text: string,
  image?: ImageItem | null,
): string {
  const d = getSnapshot();
  let page = pageById(d, pageId);
  if (!page) return '';
  page = ensureSection(page, sectionId);
  const { links, image: img } = collectLinksAndImage(text, image);
  const id = uniqueId(text.split('\n')[0] || 'nota', [
    ...page.notes.map((n) => n.id),
    ...d.pages.flatMap((p) => p.notes.map((n) => n.id)),
  ]);
  const now = Date.now();
  const note: Note = {
    id,
    section: sectionId,
    text,
    created: now,
    updated: now,
    links: links.length ? links : undefined,
    image: img,
    archived: page.kind === 'archive' || page.id === ARCHIVE_ID,
  };
  const next: Page = { ...page, notes: [...page.notes, note] };
  commit({
    ...d,
    pages: d.pages.map((p) => (p.id === pageId ? next : p)),
  });
  setLastSection(pageId, sectionId);
  return id;
}

export function updateNote(pageId: string, noteId: string, patch: Partial<Note>) {
  const d = getSnapshot();
  commit({
    ...d,
    pages: d.pages.map((p) => {
      if (p.id !== pageId) return p;
      return {
        ...p,
        notes: p.notes.map((n) => {
          if (n.id !== noteId) return n;
          const text = patch.text ?? n.text;
          const image = patch.image === undefined ? n.image : patch.image;
          const { links, image: img } = collectLinksAndImage(text, image ?? null);
          return {
            ...n,
            ...patch,
            text,
            links: links.length ? links : undefined,
            image: img,
            updated: Date.now(),
          };
        }),
      };
    }),
  });
}

export function deleteNotes(pageId: string, ids: string[]) {
  const set = new Set(ids);
  const d = getSnapshot();
  commit({
    ...d,
    pages: d.pages.map((p) =>
      p.id === pageId ? { ...p, notes: p.notes.filter((n) => !set.has(n.id)) } : p,
    ),
  });
}

function moveNotesToPage(srcPageId: string, noteIds: string[], destPageId: string, archived?: boolean) {
  const d = getSnapshot();
  const src = pageById(d, srcPageId);
  let dest = pageById(d, destPageId);
  if (!src || !dest) return;
  const set = new Set(noteIds);
  const moving = src.notes.filter((n) => set.has(n.id));
  if (!moving.length) return;

  const now = Date.now();
  const destIsArchive = dest.kind === 'archive' || dest.id === ARCHIVE_ID;
  const flag = archived ?? destIsArchive;

  let nextDest = dest;
  const placed: Note[] = [];
  for (const n of moving) {
    nextDest = ensureSection(nextDest, n.section);
    placed.push({
      ...n,
      archived: flag,
      updated: now,
    });
  }

  const pages = d.pages.map((p) => {
    if (p.id === srcPageId && p.id === destPageId) {
      const remaining = p.notes.filter((n) => !set.has(n.id));
      return { ...nextDest, notes: [...remaining, ...placed] };
    }
    if (p.id === srcPageId) return { ...p, notes: p.notes.filter((n) => !set.has(n.id)) };
    if (p.id === destPageId) return { ...nextDest, notes: [...nextDest.notes, ...placed] };
    return p;
  });
  commit({ ...d, pages });
}

export function moveNotes(srcPageId: string, noteIds: string[], destPageId: string) {
  const d = getSnapshot();
  const dest = pageById(d, destPageId);
  const archived = dest ? dest.kind === 'archive' || dest.id === ARCHIVE_ID : false;
  moveNotesToPage(srcPageId, noteIds, destPageId, archived);
}

export function archiveNotes(pageId: string, noteIds: string[]) {
  moveNotesToPage(pageId, noteIds, ARCHIVE_ID, true);
}

export function replaceDoc(next: StoreDoc) {
  if (!doc) {
    doc = next;
    emit();
    return;
  }
  if (next.updated > doc.updated) {
    doc = next;
    emit();
    void saveDoc(doc);
  }
}

export function getActivePage(): Page {
  const d = getSnapshot();
  return pageById(d, d.activePageId) ?? d.pages[0];
}
