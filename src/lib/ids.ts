export function slugify(input: string): string {
  const s = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return s || 'item';
}

export function uniqueId(base: string, existing: Iterable<string>): string {
  const taken = existing instanceof Set ? existing : new Set(existing);
  const root = slugify(base);
  if (!taken.has(root)) return root;
  let n = 2;
  while (taken.has(`${root}-${n}`)) n += 1;
  return `${root}-${n}`;
}

export function allIds(pages: { id: string; sections: { id: string }[]; notes: { id: string }[] }[]): Set<string> {
  const ids = new Set<string>();
  for (const p of pages) {
    ids.add(p.id);
    for (const s of p.sections) ids.add(s.id);
    for (const n of p.notes) ids.add(n.id);
  }
  return ids;
}
