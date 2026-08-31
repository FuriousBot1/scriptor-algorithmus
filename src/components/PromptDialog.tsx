import { useState } from 'react';

type Props = {
  title: string;
  placeholder?: string;
  value?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
};

export default function PromptDialog({ title, placeholder, value, onSubmit, onCancel }: Props) {
  const [v, setV] = useState(value ?? '');
  return (
    <div className="overlay" data-testid="overlay-prompt" role="dialog">
      <div className="prompt-box">
        <h2>{title}</h2>
        <input
          autoFocus
          value={v}
          placeholder={placeholder}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit(v.trim());
          }}
        />
        <div className="prompt-actions">
          <button className="btn" type="button" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn primary" type="button" onClick={() => onSubmit(v.trim())}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
