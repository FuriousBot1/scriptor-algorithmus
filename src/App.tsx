import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import SearchBar from './components/SearchBar';
import PageHeader from './components/PageHeader';
import SectionBlock from './components/SectionBlock';
import Composer, { type ComposerHandle } from './components/Composer';
import PageStrip from './components/PageStrip';
import EditorModal from './components/EditorModal';
import Lightbox from './components/Lightbox';
import ActionSheet from './components/ActionSheet';
import ConfirmDialog from './components/ConfirmDialog';
import PromptDialog from './components/PromptDialog';
import AppMenu from './components/AppMenu';
import Toast from './components/Toast';
import MoveSheet from './components/MoveSheet';
import {
  addNote,
  addPage,
  addSection,
  archiveNotes,
  deleteNotes,
  deletePage,
  getLastSection,
  moveNotes,
  renamePage,
  replaceDoc,
  setActivePage,
  setLastSection,
  getSnapshot,
  updateNote,
  useDoc,
} from './store/store';
import { parseComposerSend, uniqueJoin } from './lib/text';
import { shareNotes } from './lib/share';
import { takeShareInbox } from './lib/share-inbox';
import {
  closeTopViaBack,
  getOverlays,
  openOverlay,
  setExitToastHandler,
  startHistoryStack,
  subscribeOverlays,
  type Overlay,
} from './lib/history-stack';
import {
  connectDrive,
  disconnectDrive,
  hasClientId,
  loadGis,
} from './drive/gis';
import { pickDriveFile, pullRemoteDoc, setNeedPickerHandler } from './drive/client';
import type { ImageItem, Note } from './types';

export default function App() {
  const doc = useDoc();
  const overlays = useSyncExternalStore(subscribeOverlays, getOverlays, getOverlays);
  const top = overlays[overlays.length - 1] ?? null;

  const page = doc.pages.find((p) => p.id === doc.activePageId) ?? doc.pages[0];
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [chip, setChip] = useState(() => getLastSection(page.id));
  const [pendingImage, setPendingImage] = useState<ImageItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef(0);

  function showToast(msg: string) {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2000);
  }

  useEffect(() => {
    startHistoryStack();
    setExitToastHandler(showToast);
    if (hasClientId()) void loadGis();
    setNeedPickerHandler(() => {
      void pickDriveFile();
    });
    const t = window.setTimeout(() => {
      void (async () => {
        const remote = await pullRemoteDoc();
        if (remote && remote.updated > getSnapshot().updated) replaceDoc(remote);
      })();
    }, 0);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void consumeShare();
  }, []);

  useEffect(() => {
    setChip(getLastSection(page.id));
    setSelected([]);
  }, [page.id]);

  async function consumeShare() {
    const item = await takeShareInbox();
    const params = new URLSearchParams(window.location.search);
    const flagged = params.get('share') === '1';
    if (item) {
      setDraft(uniqueJoin([item.title, item.text, item.url]));
      if (item.image) setPendingImage({ src: item.image });
    }
    if (flagged || item) {
      const url = new URL(window.location.href);
      url.searchParams.delete('share');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return page.sections.map((s) => ({
        section: s,
        notes: page.notes.filter((n) => n.section === s.id),
        pageChip: null as string | null,
      }));
    }
    const hits: { note: Note; pageTitle: string; pageId: string }[] = [];
    for (const p of doc.pages) {
      for (const n of p.notes) {
        if (n.text.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)) {
          hits.push({ note: n, pageTitle: p.title, pageId: p.id });
        }
      }
    }
    return hits.map((h) => ({
      section: { id: h.note.section, title: h.note.section },
      notes: [h.note],
      pageChip: h.pageId === page.id ? null : h.pageTitle,
      pageId: h.pageId,
    }));
  }, [doc, page, query]);

  function toggleSelect(id: string) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function send() {
    const parsed = parseComposerSend(draft, Boolean(pendingImage));
    if (parsed.kind === 'noop') return;
    if (parsed.kind === 'section') {
      addSection(page.id, parsed.title);
      setDraft('');
      composerRef.current?.blur();
      return;
    }
    const dest = page.sections.some((s) => s.id === chip) ? chip : getLastSection(page.id);
    addNote(page.id, dest, parsed.text, pendingImage);
    setLastSection(page.id, dest);
    setDraft('');
    setPendingImage(null);
    composerRef.current?.blur();
  }

  function openEditor(noteId: string) {
    openOverlay({ kind: 'editor', noteId });
  }

  const editorNote =
    top?.kind === 'editor' ? page.notes.find((n) => n.id === top.noteId) ?? findNote(top.noteId) : null;

  function findNote(id: string): Note | undefined {
    for (const p of doc.pages) {
      const n = p.notes.find((x) => x.id === id);
      if (n) return n;
    }
    return undefined;
  }

  function notePageId(noteId: string): string {
    for (const p of doc.pages) {
      if (p.notes.some((n) => n.id === noteId)) return p.id;
    }
    return page.id;
  }

  return (
    <div className="app">
      <div className="app-top">
        <SearchBar value={query} onChange={setQuery} />
        <button
          type="button"
          className="icon-btn"
          data-testid="menu-app"
          aria-label="Menu"
          onClick={() => openOverlay({ kind: 'menu' })}
        >
          <Dots />
        </button>
      </div>

      <PageHeader title={page.title} onMenu={() => openOverlay({ kind: 'sheet', sheet: 'page' })} />

      <main className="page-scroll">
        {query.trim()
          ? (filtered as Array<{ section: { id: string; title: string }; notes: Note[]; pageChip: string | null; pageId?: string }>).map(
              (block, i) => (
                <div key={`${block.notes[0]?.id || i}-hit`}>
                  {block.pageChip && block.pageId ? (
                    <div className="page-chip-row">
                      <button
                        type="button"
                        className="search-hit-chip"
                        onClick={() => setActivePage(block.pageId!)}
                      >
                        {block.pageChip}
                      </button>
                    </div>
                  ) : null}
                  {block.notes.map((n) => (
                    <div key={n.id} data-testid={`section-${n.section}`}>
                      <SectionBlock
                        section={{ id: n.section, title: n.section }}
                        notes={[n]}
                        selectedIds={selected}
                        onAdd={() => {
                          setChip(n.section);
                          setLastSection(page.id, n.section);
                          composerRef.current?.focus();
                        }}
                        onToggleSelect={toggleSelect}
                        onOpenEditor={openEditor}
                        onOpenLightbox={(id) => {
                          const note = findNote(id);
                          if (note?.image?.src) openOverlay({ kind: 'lightbox', src: note.image.src, alt: note.image.alt });
                        }}
                        onArchive={() => archiveNotes(notePageId(n.id), selected.length ? selected : [n.id])}
                        onDelete={() =>
                          openOverlay({
                            kind: 'confirm',
                            title: 'Excluir nota?',
                            action: 'delete-notes',
                          })
                        }
                        onShare={() => {
                          const ids = selected.length ? selected : [n.id];
                          const notes = ids.map(findNote).filter(Boolean) as Note[];
                          void shareNotes(notes);
                        }}
                        onMove={() => openOverlay({ kind: 'move' })}
                      />
                    </div>
                  ))}
                </div>
              ),
            )
          : page.sections.map((s) => (
              <SectionBlock
                key={s.id}
                section={s}
                notes={page.notes.filter((n) => n.section === s.id)}
                selectedIds={selected}
                onAdd={() => {
                  setChip(s.id);
                  setLastSection(page.id, s.id);
                  composerRef.current?.focus();
                }}
                onToggleSelect={toggleSelect}
                onOpenEditor={openEditor}
                onOpenLightbox={(id) => {
                  const note = findNote(id);
                  if (note?.image?.src) openOverlay({ kind: 'lightbox', src: note.image.src, alt: note.image.alt });
                }}
                onArchive={() => {
                  const ids = selected.length ? selected : [];
                  if (ids.length) {
                    archiveNotes(page.id, ids);
                    setSelected([]);
                  }
                }}
                onDelete={() =>
                  openOverlay({
                    kind: 'confirm',
                    title: selected.length > 1 ? `Excluir ${selected.length} notas?` : 'Excluir nota?',
                    action: 'delete-notes',
                  })
                }
                onShare={() => {
                  const notes = page.notes.filter((n) => selected.includes(n.id));
                  void shareNotes(notes);
                }}
                onMove={() => openOverlay({ kind: 'move' })}
              />
            ))}
      </main>

      <div className="dock">
        <Composer
          ref={composerRef}
          text={draft}
          chip={chip}
          image={pendingImage}
          onText={setDraft}
          onPlus={() => openOverlay({ kind: 'sheet', sheet: 'composer' })}
          onChip={() => openOverlay({ kind: 'sheet', sheet: 'chip' })}
          onSend={send}
        />
        <PageStrip
          pages={doc.pages}
          activeId={page.id}
          onSelect={(id) => setActivePage(id)}
          onAdd={() =>
            openOverlay({ kind: 'prompt', title: 'Nova pagina', placeholder: 'nome', action: 'new-page' })
          }
          onLongPress={(id) => {
            const p = doc.pages.find((x) => x.id === id);
            if (!p || p.kind === 'archive' || p.id === 'arquivo') return;
            openOverlay({
              kind: 'confirm',
              title: `Excluir pagina ${p.title}?`,
              action: 'delete-page',
              payload: id,
            });
          }}
        />
      </div>

      <input
        ref={fileRef}
        className="hidden-file"
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') setPendingImage({ src: reader.result, alt: f.name });
          };
          reader.readAsDataURL(f);
        }}
      />

      {renderOverlay(top)}

      <Toast message={toast} />
    </div>
  );

  function renderOverlay(o: Overlay | null) {
    if (!o) return null;
    if (o.kind === 'menu') {
      return (
        <AppMenu
          onClose={closeTopViaBack}
          onConnectDrive={() => {
            closeTopViaBack();
            void connectDrive();
          }}
          onPickFile={() => {
            closeTopViaBack();
            void pickDriveFile();
          }}
          onDisconnect={() => {
            disconnectDrive();
            closeTopViaBack();
          }}
        />
      );
    }
    if (o.kind === 'sheet' && o.sheet === 'chip') {
      return (
        <ActionSheet
          items={page.sections.map((s) => ({ id: `sec:${s.id}`, label: `#${s.title}` }))}
          onPick={(id) => {
            if (id.startsWith('sec:')) {
              const sid = id.slice(4);
              setChip(sid);
              setLastSection(page.id, sid);
            }
            closeTopViaBack();
          }}
          onClose={closeTopViaBack}
        />
      );
    }
    if (o.kind === 'sheet' && o.sheet === 'composer') {
      return (
        <ActionSheet
          items={[
            { id: 'attach', label: 'Anexar imagem' },
            { id: 'new-section', label: 'Nova seção' },
          ]}
          onPick={(id) => {
            if (id === 'attach') {
              closeTopViaBack();
              fileRef.current?.click();
              return;
            }
            if (id === 'new-section') {
              closeTopViaBack();
              window.setTimeout(
                () =>
                  openOverlay({
                    kind: 'prompt',
                    title: 'Nova seção',
                    placeholder: 'nome',
                    action: 'new-section',
                  }),
                50,
              );
              return;
            }
            if (id.startsWith('sec:')) {
              const sid = id.slice(4);
              setChip(sid);
              setLastSection(page.id, sid);
              closeTopViaBack();
            }
          }}
          onClose={closeTopViaBack}
        />
      );
    }
    if (o.kind === 'sheet' && o.sheet === 'page') {
      return (
        <ActionSheet
          items={[{ id: 'rename', label: 'Renomear pagina' }]}
          onPick={(id) => {
            if (id === 'rename') {
              closeTopViaBack();
              window.setTimeout(
                () =>
                  openOverlay({
                    kind: 'prompt',
                    title: 'Renomear pagina',
                    value: page.title,
                    action: 'rename-page',
                  }),
                50,
              );
            }
          }}
          onClose={closeTopViaBack}
        />
      );
    }
    if (o.kind === 'confirm') {
      return (
        <ConfirmDialog
          title={o.title}
          body={o.body}
          onCancel={closeTopViaBack}
          onConfirm={() => {
            if (o.action === 'delete-notes') {
              deleteNotes(page.id, selected);
              setSelected([]);
            } else if (o.action === 'delete-page' && o.payload) {
              deletePage(o.payload);
            }
            closeTopViaBack();
          }}
        />
      );
    }
    if (o.kind === 'prompt') {
      return (
        <PromptDialog
          title={o.title}
          placeholder={o.placeholder}
          value={o.value}
          onCancel={closeTopViaBack}
          onSubmit={(v) => {
            if (!v) {
              closeTopViaBack();
              return;
            }
            if (o.action === 'new-page') addPage(v);
            if (o.action === 'rename-page') renamePage(page.id, v);
            if (o.action === 'new-section') {
              const id = addSection(page.id, v);
              setChip(id);
            }
            closeTopViaBack();
          }}
        />
      );
    }
    if (o.kind === 'move') {
      return (
        <MoveSheet
          pages={doc.pages}
          currentId={page.id}
          onClose={closeTopViaBack}
          onPick={(dest) => {
            const ids = selected.length ? selected : [];
            if (ids.length) {
              moveNotes(page.id, ids, dest);
              setSelected([]);
            }
            closeTopViaBack();
          }}
        />
      );
    }
    if (o.kind === 'editor' && editorNote) {
      return (
        <EditorModal
          note={editorNote}
          onClose={closeTopViaBack}
          onSave={(text) => {
            updateNote(notePageId(editorNote.id), editorNote.id, { text });
            closeTopViaBack();
          }}
        />
      );
    }
    if (o.kind === 'lightbox') {
      return <Lightbox src={o.src} alt={o.alt} onClose={closeTopViaBack} />;
    }
    return null;
  }
}

function Dots() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  );
}
