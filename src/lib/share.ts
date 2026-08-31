import type { Note } from '../types';
import { splitTitleBody } from './text';

function dataUrlToFile(src: string, name = 'imagem.png'): File | null {
  try {
    const comma = src.indexOf(',');
    if (comma < 0) return null;
    const header = src.slice(0, comma);
    const b64 = src.slice(comma + 1);
    const mime = /data:([^;]+)/.exec(header)?.[1] || 'image/png';
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ext = mime.split('/')[1] || 'png';
    return new File([bytes], name.endsWith(ext) ? name : `imagem.${ext}`, { type: mime });
  } catch {
    return null;
  }
}

async function srcToFile(src: string, name = 'imagem.png'): Promise<File | null> {
  if (src.startsWith('data:')) return dataUrlToFile(src, name);
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const type = blob.type || 'image/png';
    const ext = type.split('/')[1] || 'png';
    return new File([blob], name.endsWith(ext) ? name : `imagem.${ext}`, { type });
  } catch {
    return null;
  }
}

export async function shareNotes(notes: Note[]): Promise<boolean> {
  if (!notes.length) return false;
  const text = notes.map((n) => n.text).join('\n\n');
  const title = splitTitleBody(notes[0].text).title || 'Scriptor';
  const data: ShareData = { title, text };

  const withImg = notes.find((n) => n.image?.src);
  if (withImg?.image?.src) {
    const file = await srcToFile(withImg.image.src);
    if (file) data.files = [file];
  }

  if (typeof navigator.share !== 'function') return false;
  try {
    const can = !data.files || navigator.canShare?.(data) !== false;
    if (!can && data.files) delete data.files;
    await navigator.share(data);
    return true;
  } catch (err) {
    const name = (err as { name?: string })?.name;
    if (name === 'AbortError') return false;
    if (data.files) {
      try {
        delete data.files;
        await navigator.share(data);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
