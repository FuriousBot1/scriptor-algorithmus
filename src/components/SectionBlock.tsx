import type { Note, Section } from '../types';
import NoteCard from './NoteCard';

type Props = {
  section: Section;
  notes: Note[];
  selectedIds: string[];
  onAdd: () => void;
  onToggleSelect: (id: string) => void;
  onOpenEditor: (id: string) => void;
  onOpenLightbox: (id: string) => void;
  onArchive: () => void;
  onDelete: () => void;
  onShare: () => void;
  onMove: () => void;
};

export default function SectionBlock({
  section,
  notes,
  selectedIds,
  onAdd,
  onToggleSelect,
  onOpenEditor,
  onOpenLightbox,
  onArchive,
  onDelete,
  onShare,
  onMove,
}: Props) {
  const lastSelected = selectedIds[selectedIds.length - 1];
  return (
    <section className="section-block" data-testid={`section-${section.id}`}>
      <div className="section-head">
        <h3 className="section-title">{section.title}</h3>
        <button
          type="button"
          className="icon-btn"
          aria-label={`Adicionar em ${section.title}`}
          onClick={onAdd}
        >
          +
        </button>
      </div>
      {notes.map((n) => (
        <NoteCard
          key={n.id}
          note={n}
          selected={selectedIds.includes(n.id)}
          showCluster={lastSelected === n.id && selectedIds.length > 0}
          clusterCount={selectedIds.length}
          onToggleSelect={() => onToggleSelect(n.id)}
          onOpenEditor={() => onOpenEditor(n.id)}
          onOpenLightbox={() => onOpenLightbox(n.id)}
          onArchive={onArchive}
          onDelete={onDelete}
          onShare={onShare}
          onMove={onMove}
        />
      ))}
    </section>
  );
}
