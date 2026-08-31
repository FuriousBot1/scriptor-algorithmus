type Item = { id: string; label: string; danger?: boolean };

type Props = {
  items: Item[];
  onPick: (id: string) => void;
  onClose: () => void;
};

export default function ActionSheet({ items, onPick, onClose }: Props) {
  return (
    <div className="overlay" data-testid="overlay-sheet" onClick={onClose} role="dialog">
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className="sheet-item"
            style={it.danger ? { color: 'var(--danger)' } : undefined}
            onClick={() => onPick(it.id)}
          >
            {it.label}
          </button>
        ))}
        <button type="button" className="sheet-item" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
