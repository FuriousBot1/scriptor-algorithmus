import { useEffect, useRef, useState } from 'react';
import type { Note } from '../types';

type Props = {
  note: Note;
  onSave: (text: string) => void;
  onClose: () => void;
};

export default function EditorModal({ note, onSave, onClose }: Props) {
  const [text, setText] = useState(note.text);
  const [kb, setKb] = useState(0);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const height = window.innerHeight - vv.height - vv.offsetTop;
      setKb(Math.max(0, height));
    };
    onResize();
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => {
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onResize);
    };
  }, []);

  useEffect(() => {
    const el = fieldRef.current;
    if (!el) return;
    el.focus();
    el.scrollIntoView({ block: 'center' });
  }, []);

  return (
    <div className="overlay" data-testid="overlay-editor" role="dialog">
      <div
        className="overlay-full"
        style={{ paddingBottom: `calc(24px + env(safe-area-inset-bottom) + ${kb}px)` }}
      >
        <div className="overlay-head">
          <button className="icon-btn" type="button" aria-label="Fechar" onClick={onClose}>
            X
          </button>
          <button className="btn primary" type="button" onClick={() => onSave(text)}>
            Salvar
          </button>
        </div>
        <textarea
          ref={fieldRef}
          className="editor-field"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={(e) => e.currentTarget.scrollIntoView({ block: 'center' })}
        />
      </div>
    </div>
  );
}
