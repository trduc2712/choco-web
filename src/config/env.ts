import { z } from 'zod'

import { parseApiBaseUrl } from './api-base-url'

export const APP_ENVIRONMENTS = ['local', 'staging', 'production'] as const

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number]

// Where direct messages come from: the in-memory mock, choco-api, or nowhere
// (messaging is hidden).
export const MESSAGING_APIS = ['mock', 'http', 'off'] as const

export type MessagingApiKind = (typeof MESSAGING_APIS)[number]

const envSchema = z.object({
  VITE_API_BASE_URL: z.url(),
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  // Which deployment this is. Unset, the dev server is local and a build is
  // production.
  VITE_APP_ENV: z.enum(APP_ENVIRONMENTS).optional(),
  // Unset, the dev server uses the mock and a build hides messaging.
  VITE_MESSAGING_API: z.enum(MESSAGING_APIS).optional(),
})

const parsedEnv = envSchema.safeParse(import.meta.env)

if (!parsedEnv.success) {
  throw new Error(
    `Invalid environment variables:\n${z.prettifyError(parsedEnv.error)}`,
  )
}

export const env = {
  apiBaseUrl: parseApiBaseUrl(parsedEnv.data.VITE_API_BASE_URL),
  clerkPublishableKey: parsedEnv.data.VITE_CLERK_PUBLISHABLE_KEY,
  appEnv: (parsedEnv.data.VITE_APP_ENV ??
    (import.meta.env.DEV ? 'local' : 'production')) satisfies AppEnvironment,
  messagingApi: (parsedEnv.data.VITE_MESSAGING_API ??
    (import.meta.env.DEV ? 'mock' : 'off')) satisfies MessagingApiKind,
}
