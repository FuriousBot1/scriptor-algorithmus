import { useRef, type PointerEvent as PE, type MouseEvent as ME } from 'react';
import type { Note } from '../types';
import { splitTitleBody } from '../lib/text';
import { vibrate } from '../lib/haptic';
import SelectionCluster from './SelectionCluster';

type Props = {
  note: Note;
  selected: boolean;
  showCluster: boolean;
  clusterCount: number;
  onToggleSelect: () => void;
  onOpenEditor: () => void;
  onOpenLightbox: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onShare: () => void;
  onMove: () => void;
};

export default function NoteCard({
  note,
  selected,
  showCluster,
  clusterCount,
  onToggleSelect,
  onOpenEditor,
  onOpenLightbox,
  onArchive,
  onDelete,
  onShare,
  onMove,
}: Props) {
  const { title, body } = splitTitleBody(note.text);
  const long = useRef({ timer: 0, did: false });

  function startPress(_e: PE) {
    long.current.did = false;
    window.clearTimeout(long.current.timer);
    long.current.timer = window.setTimeout(() => {
      long.current.did = true;
      vibrate(10);
      if (!selected) onToggleSelect();
    }, 500);
  }
  function endPress() {
    window.clearTimeout(long.current.timer);
  }

  function onCardClick(e: ME) {
    if (long.current.did) return;
    const t = e.target as HTMLElement;
    if (t.closest('a, .note-radio, .note-thumb, .cluster, [data-testid="selection-cluster"]')) return;
    if (t.closest('.note-text')) {
      onOpenEditor();
      return;
    }
    onToggleSelect();
  }

  return (
    <article
      className={`note-card${selected ? ' selected' : ''}`}
      data-testid={`note-${note.id}`}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
      onClick={onCardClick}
    >
      <button
        type="button"
        className="note-radio"
        aria-label="Selecionar"
        onClick={(e) => {
          e.stopPropagation();
          if (long.current.did) return;
          onToggleSelect();
        }}
      >
        <span className="note-radio-dot" />
      </button>
      <div className="note-main">
        <div className="note-text">
          <h3 className="note-title">{title || ' '}</h3>
          {body.trim() ? <p className="note-body">{body.trim()}</p> : null}
        </div>
        <div className="note-empty" />
        {note.links?.length ? (
          <div className="note-links">
            {note.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                {l.title || l.url}
              </a>
            ))}
          </div>
        ) : null}
      </div>
      {note.image?.src ? (
        <img
          className="note-thumb"
          src={note.image.src}
          alt={note.image.alt || ''}
          onClick={(e) => {
            e.stopPropagation();
            if (long.current.did) return;
            onOpenLightbox();
          }}
        />
      ) : (
        <span className="note-side-empty" aria-hidden />
      )}
      {showCluster ? (
        <SelectionCluster
          count={clusterCount}
          onArchive={onArchive}
          onDelete={onDelete}
          onShare={onShare}
          onEdit={onOpenEditor}
          onMove={onMove}
        />
      ) : null}
    </article>
  );
}
