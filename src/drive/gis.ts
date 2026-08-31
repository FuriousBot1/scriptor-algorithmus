const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const TOKEN_KEY = 'scriptor.driveToken';
const EXP_KEY = 'scriptor.driveTokenExp';
const CONNECTED_KEY = 'scriptor.driveConnected';
export const FILE_ID_KEY = 'scriptor.driveFileId';

type TokenClient = {
  callback: (resp: TokenResponse) => void;
  requestAccessToken: (opts: { prompt: string }) => void;
};

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  error?: string;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (resp: TokenResponse) => void;
          }) => TokenClient;
        };
      };
    };
  }
}

function clientId(): string {
  return (import.meta.env.VITE_SCRIPTOR_CLIENT_ID as string | undefined)?.trim() || '';
}

export function hasClientId(): boolean {
  return Boolean(clientId());
}

let tokenClient: TokenClient | null = null;
let gisLoaded = false;
let loadPromise: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('gis load failed'));
    document.head.appendChild(s);
  });
}

export function loadGis(): Promise<void> {
  if (!hasClientId()) return Promise.resolve();
  if (gisLoaded) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    await loadScript('https://accounts.google.com/gsi/client');
    const id = clientId();
    tokenClient = window.google!.accounts.oauth2.initTokenClient({
      client_id: id,
      scope: SCOPE,
      callback: () => {},
    });
    gisLoaded = true;
  })();
  return loadPromise;
}

function readCachedToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const exp = Number(localStorage.getItem(EXP_KEY) || 0);
  if (!token || !exp) return null;
  if (Date.now() >= exp - 15_000) return null;
  return token;
}

function storeToken(token: string, expiresIn: number) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(EXP_KEY, String(Date.now() + expiresIn * 1000));
}

function isConnected(): boolean {
  return localStorage.getItem(CONNECTED_KEY) === '1';
}

export function setConnected(v: boolean) {
  if (v) localStorage.setItem(CONNECTED_KEY, '1');
  else localStorage.removeItem(CONNECTED_KEY);
}

export function getStoredFileId(): string {
  return (
    localStorage.getItem(FILE_ID_KEY) ||
    (import.meta.env.VITE_SCRIPTOR_FILE_ID as string | undefined) ||
    ''
  );
}

export function setStoredFileId(id: string) {
  localStorage.setItem(FILE_ID_KEY, id);
}

function requestToken(prompt: '' | 'consent'): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('GIS not loaded'));
      return;
    }
    tokenClient.callback = (resp) => {
      if (resp.error || !resp.access_token) {
        reject(new Error(resp.error || 'token'));
        return;
      }
      storeToken(resp.access_token, resp.expires_in ?? 3600);
      resolve(resp.access_token);
    };
    tokenClient.requestAccessToken({ prompt });
  });
}

export async function getAccessToken(opts: {
  interactive?: boolean;
  force?: boolean;
}): Promise<string | null> {
  if (!hasClientId()) return null;
  await loadGis();
  if (!opts.force) {
    const cached = readCachedToken();
    if (cached) return cached;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
  }

  const connected = isConnected();
  if (connected) {
    try {
      return await requestToken('');
    } catch {
      if (opts.interactive) {
        const t = await requestToken('consent');
        setConnected(true);
        return t;
      }
      return null;
    }
  }

  if (!opts.interactive) return null;
  const t = await requestToken('consent');
  setConnected(true);
  return t;
}

export async function connectDrive(): Promise<string | null> {
  return getAccessToken({ interactive: true });
}

export function disconnectDrive() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXP_KEY);
  localStorage.removeItem(CONNECTED_KEY);
}

export function driveConnected(): boolean {
  return isConnected();
}
