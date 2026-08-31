/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SCRIPTOR_CLIENT_ID?: string;
  readonly VITE_SCRIPTOR_FILE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
