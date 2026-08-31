type Props = {
  src: string;
  alt?: string;
  onClose: () => void;
};

export default function Lightbox({ src, alt, onClose }: Props) {
  return (
    <div className="overlay" data-testid="overlay-lightbox" onClick={onClose} role="dialog">
      <div className="overlay-full">
        <div className="overlay-head">
          <span />
          <button className="icon-btn" type="button" aria-label="Fechar" onClick={onClose}>
            X
          </button>
        </div>
        <img className="lightbox-img" src={src} alt={alt || ''} />
      </div>
    </div>
  );
}
