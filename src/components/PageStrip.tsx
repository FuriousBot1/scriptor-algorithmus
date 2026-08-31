import type { Page } from '../types';

type Props = {
  pages: Page[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onLongPress: (id: string) => void;
};

export default function PageStrip({ pages, activeId, onSelect, onAdd, onLongPress }: Props) {
  const archive = pages.find((p) => p.kind === 'archive' || p.id === 'arquivo');
  const normals = pages.filter((p) => p !== archive);

  return (
    <div className="page-strip" data-testid="page-strip">
      {normals.map((p) => (
        <Square
          key={p.id}
          page={p}
          current={p.id === activeId}
          archive={false}
          onSelect={onSelect}
          onLongPress={onLongPress}
        />
      ))}
      {archive ? (
        <Square
          page={archive}
          current={archive.id === activeId}
          archive
          onSelect={onSelect}
          onLongPress={onLongPress}
        />
      ) : null}
      <button type="button" className="strip-sq add" aria-label="Nova pagina" onClick={onAdd}>
        +
      </button>
    </div>
  );
}

function Square({
  page,
  current,
  archive,
  onSelect,
  onLongPress,
}: {
  page: Page;
  current: boolean;
  archive: boolean;
  onSelect: (id: string) => void;
  onLongPress: (id: string) => void;
}) {
  const timer = { current: 0 as number };
  return (
    <button
      type="button"
      className={`strip-sq${current ? ' current' : ''}${archive ? ' archive' : ''}`}
      aria-label={page.title}
      data-page-id={page.id}
      onPointerDown={() => {
        timer.current = window.setTimeout(() => onLongPress(page.id), 500);
      }}
      onPointerUp={() => window.clearTimeout(timer.current)}
      onPointerLeave={() => window.clearTimeout(timer.current)}
      onClick={() => onSelect(page.id)}
    >
      {archive ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 7h18v4H3zM5 11v8h14v-8" />
        </svg>
      ) : null}
    </button>
  );
}
