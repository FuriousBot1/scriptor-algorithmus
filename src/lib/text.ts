import type { ImageItem, LinkItem } from '../types';

export function splitTitleBody(text: string): { title: string; body: string } {
  const i = text.indexOf('\n');
  if (i < 0) return { title: text, body: '' };
  return { title: text.slice(0, i), body: text.slice(i + 1) };
}

export function extractUrls(text: string): string[] {
  const re = /https?:\/\/[^\s<>"'`]+/gi;
  const found = text.match(re) ?? [];
  return found.map((u) => u.replace(/[),.;!?]+$/g, ''));
}

export function isImageUrl(url: string): boolean {
  if (url.startsWith('data:image/')) return true;
  const path = url.split('#')[0].split('?')[0];
  return /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(path);
}

export function collectLinksAndImage(
  text: string,
  attached?: ImageItem | null,
): { links: LinkItem[]; image?: ImageItem } {
  const urls = extractUrls(text);
  const links: LinkItem[] = urls.map((url) => ({ url }));
  if (attached?.src) return { links, image: attached };
  const img = urls.find(isImageUrl);
  if (img) return { links, image: { src: img } };
  return { links };
}

export function parseComposerSend(
  text: string,
  hasImage: boolean,
): { kind: 'noop' } | { kind: 'section'; title: string } | { kind: 'note'; text: string } {
  const trimmed = text.trim();
  if (!trimmed && !hasImage) return { kind: 'noop' };
  if (!hasImage && trimmed) {
    const lines = trimmed.split('\n');
    if (lines.length === 1) {
      const m = lines[0].match(/^#\s*(.+)$/);
      if (m && m[1].trim()) return { kind: 'section', title: m[1].trim() };
    }
  }
  return { kind: 'note', text };
}

export function uniqueJoin(parts: Array<string | undefined | null>): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of parts) {
    const t = (p ?? '').trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out.join('\n');
}

export function isSectionOnlyLine(text: string): boolean {
  return /^#\s*\S/.test(text.trim()) && !text.includes('\n');
}
