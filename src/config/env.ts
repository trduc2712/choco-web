import { z } from 'zod'

import { parseApiBaseUrl } from './api-base-url'

const envSchema = z.object({
  VITE_API_BASE_URL: z.url(),
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
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
}
