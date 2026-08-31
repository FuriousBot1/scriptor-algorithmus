type Props = {
  title: string;
  body?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({ title, body, onConfirm, onCancel }: Props) {
  return (
    <div className="overlay" data-testid="overlay-confirm" role="dialog">
      <div className="confirm-box">
        <h2>{title}</h2>
        {body ? <p style={{ color: 'var(--muted)', margin: 0 }}>{body}</p> : null}
        <div className="confirm-actions">
          <button className="btn" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn danger" type="button" onClick={onConfirm}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
}
