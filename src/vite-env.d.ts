interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
  readonly VITE_APP_ENV?: string
}

// The build commit SHA, injected by Vite at build time (see vite.config.ts).
declare const __APP_VERSION__: string

interface ImportMeta {
  readonly env: ImportMetaEnv
}
