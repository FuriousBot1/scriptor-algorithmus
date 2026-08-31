type Props = {
  title: string;
  onMenu: () => void;
};

export default function PageHeader({ title, onMenu }: Props) {
  return (
    <header className="page-header" data-testid="page-header">
      <h2 className="page-title">{title}</h2>
      <button className="icon-btn" aria-label="Menu da pagina" onClick={onMenu} type="button">
        <Dots />
      </button>
    </header>
  );
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
