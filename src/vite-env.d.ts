/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_AI_URL?: string
  readonly VITE_LOCAL_AI_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
