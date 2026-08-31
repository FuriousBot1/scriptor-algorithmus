import type { PointerEvent as PE } from 'react';
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
  const long = { current: 0 as number, did: false };

  function startPress(_e: PE) {
    long.did = false;
    long.current = window.setTimeout(() => {
      long.did = true;
      vibrate(10);
      if (!selected) onToggleSelect();
    }, 500);
  }
  function endPress() {
    window.clearTimeout(long.current);
  }

  return (
    <article
      className={`note-card${selected ? ' selected' : ''}`}
      data-testid={`note-${note.id}`}
      onPointerDown={startPress}
      onPointerUp={endPress}
      onPointerLeave={endPress}
      onPointerCancel={endPress}
    >
      <button
        type="button"
        className="note-radio"
        aria-label="Selecionar"
        onClick={(e) => {
          e.stopPropagation();
          if (long.did) return;
          onToggleSelect();
        }}
      >
        <span className="note-radio-dot" />
      </button>
      <div className="note-main">
        <div
          className="note-text"
          onClick={() => {
            if (long.did) return;
            onOpenEditor();
          }}
        >
          <h3 className="note-title">{title || ' '}</h3>
          {body.trim() ? <p className="note-body">{body.trim()}</p> : null}
        </div>
        <div
          className="note-empty"
          onClick={() => {
            if (long.did) return;
            onToggleSelect();
          }}
        />
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
            if (long.did) return;
            onOpenLightbox();
          }}
        />
      ) : (
        <span />
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
