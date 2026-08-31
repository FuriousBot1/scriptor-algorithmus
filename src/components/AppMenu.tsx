import { driveConnected, hasClientId } from '../drive/gis';

type Props = {
  onClose: () => void;
  onConnectDrive: () => void;
  onPickFile: () => void;
  onDisconnect: () => void;
};

export default function AppMenu({ onClose, onConnectDrive, onPickFile, onDisconnect }: Props) {
  const drive = hasClientId();
  const connected = drive && driveConnected();
  return (
    <div className="overlay" data-testid="overlay-menu" onClick={onClose} role="dialog">
      <div className="overlay-panel" onClick={(e) => e.stopPropagation()}>
        {drive ? (
          <>
            {!connected ? (
              <button type="button" className="sheet-item" onClick={onConnectDrive}>
                Conectar Drive
              </button>
            ) : (
              <>
                <button type="button" className="sheet-item" onClick={onPickFile}>
                  Escolher arquivo Drive
                </button>
                <button type="button" className="sheet-item" onClick={onDisconnect}>
                  Desconectar Drive
                </button>
              </>
            )}
          </>
        ) : null}
        <button type="button" className="sheet-item" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );
}
