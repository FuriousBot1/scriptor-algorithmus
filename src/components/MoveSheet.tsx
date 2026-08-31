import type { Page } from '../types';

type Props = {
  pages: Page[];
  currentId: string;
  onPick: (pageId: string) => void;
  onClose: () => void;
};

export default function MoveSheet({ pages, currentId, onPick, onClose }: Props) {
  return (
    <div className="overlay" data-testid="overlay-move" onClick={onClose} role="dialog">
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        {pages
          .filter((p) => p.id !== currentId)
          .map((p) => (
            <button key={p.id} type="button" className="sheet-item" onClick={() => onPick(p.id)}>
              {p.title}
            </button>
          ))}
        <button type="button" className="sheet-item" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
