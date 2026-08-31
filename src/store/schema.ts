import type { Note, Page, Section, StoreDoc } from '../types';

function isObj(x: unknown): x is Record<string, unknown> {
  return !!x && typeof x === 'object';
}

function isSection(x: unknown): x is Section {
  if (!isObj(x)) return false;
  return typeof x.id === 'string' && typeof x.title === 'string';
}

function isNote(x: unknown): x is Note {
  if (!isObj(x)) return false;
  return (
    typeof x.id === 'string' &&
    typeof x.section === 'string' &&
    typeof x.text === 'string' &&
    typeof x.created === 'number' &&
    typeof x.updated === 'number'
  );
}

function isPage(x: unknown): x is Page {
  if (!isObj(x)) return false;
  return (
    typeof x.id === 'string' &&
    typeof x.title === 'string' &&
    Array.isArray(x.sections) &&
    x.sections.every(isSection) &&
    Array.isArray(x.notes) &&
    x.notes.every(isNote)
  );
}

export function isValidDoc(x: unknown): x is StoreDoc {
  if (!isObj(x)) return false;
  if (typeof x.updated !== 'number') return false;
  if (typeof x.activePageId !== 'string') return false;
  if (!Array.isArray(x.pages) || x.pages.length === 0) return false;
  if (!x.pages.every(isPage)) return false;
  return x.pages.some((p) => p.id === x.activePageId);
}

export const ARCHIVE_ID = 'arquivo';
export const GERAL_ID = 'geral';
