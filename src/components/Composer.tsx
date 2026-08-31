import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { ImageItem } from '../types';

export type ComposerHandle = {
  focus: () => void;
  blur: () => void;
};

type Props = {
  text: string;
  chip: string;
  image: ImageItem | null;
  onText: (v: string) => void;
  onPlus: () => void;
  onChip: () => void;
  onSend: () => void;
};

const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  { text, chip, image, onText, onPlus, onChip, onSend },
  ref,
) {
  const ta = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => ta.current?.focus(),
    blur: () => ta.current?.blur(),
  }));

  return (
    <div className="composer" data-testid="composer">
      <button type="button" className="icon-btn" aria-label="Mais" onClick={onPlus}>
        +
      </button>
      <button type="button" className="chip" data-testid="composer-chip" onClick={onChip}>
        #{chip}
      </button>
      {image ? <img className="composer-thumb" src={image.src} alt="" /> : null}
      <textarea
        ref={ta}
        value={text}
        placeholder="Nova nota..."
        enterKeyHint="enter"
        rows={1}
        onChange={(e) => onText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            /* newline only; send is the arrow */
            return;
          }
        }}
      />
      <button
        type="button"
        className="send-btn"
        data-testid="composer-send"
        aria-label="Enviar"
        onClick={onSend}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M3 11l18-8-8 18-2-7-8-3z" />
        </svg>
      </button>
    </div>
  );
});

export default Composer;
