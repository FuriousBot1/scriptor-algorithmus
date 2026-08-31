type Props = {
  count: number;
  onArchive: () => void;
  onDelete: () => void;
  onShare: () => void;
  onEdit: () => void;
  onMove: () => void;
};

export default function SelectionCluster({
  count,
  onArchive,
  onDelete,
  onShare,
  onEdit,
  onMove,
}: Props) {
  return (
    <div className="cluster" data-testid="selection-cluster">
      <button type="button" aria-label="Arquivar" onClick={onArchive}>
        <BoxIcon />
      </button>
      <button type="button" className="danger" aria-label="Excluir" onClick={onDelete}>
        <TrashIcon />
      </button>
      <button type="button" aria-label="Compartilhar" onClick={onShare}>
        <ShareIcon />
      </button>
      {count === 1 ? (
        <button type="button" aria-label="Editar" onClick={onEdit}>
          <PencilIcon />
        </button>
      ) : null}
      <button type="button" data-testid="selection-move" aria-label="Mover" onClick={onMove}>
        <MoveIcon />
      </button>
    </div>
  );
}

function BoxIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8l-9-4-9 4 9 4 9-4z" />
      <path d="M3 8v8l9 4 9-4V8" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20l4-1 11-11-3-3L5 16l-1 4z" />
    </svg>
  );
}
function MoveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7h12M3 12h18M3 17h12" />
      <path d="M17 7l4 5-4 5" />
    </svg>
  );
}
