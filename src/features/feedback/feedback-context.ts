import type { Theme } from '@/features/theme'

export const SUPPORTED_LOCALES = ['en', 'ja', 'vi'] as const

export type FeedbackLocale = (typeof SUPPORTED_LOCALES)[number]

// What the app sends with a feedback. The server reads the User-Agent header
// itself, so it is not part of the body.
export type FeedbackRequestContext = {
  path: string
  locale: FeedbackLocale
  theme: Theme
  viewport: { width: number; height: number }
  appVersion: string
}

// What the admin endpoints return: the context as sent, plus the user agent
// the server recorded.
export type FeedbackContext = FeedbackRequestContext & {
  userAgent: string
}

const APP_VERSION_MAX_LENGTH = 64

type ContextSource = {
  pathname: string
  language: string | undefined
  theme: Theme
  innerWidth: number
  innerHeight: number
  appVersion: string
}

function toLocale(language: string | undefined): FeedbackLocale {
  const base = language?.split('-')[0]
  return SUPPORTED_LOCALES.find((locale) => locale === base) ?? 'en'
}

function toDimension(value: number): number {
  return Math.min(100000, Math.max(1, Math.round(value) || 1))
}

// Builds what choco-api expects: the path without query or hash, the theme as
// chosen (so "system" stays "system"), and bounded sizes.
export function buildFeedbackContext(
  source: ContextSource,
): FeedbackRequestContext {
  return {
    path: source.pathname.split(/[?#]/)[0] || '/',
    locale: toLocale(source.language),
    theme: source.theme,
    viewport: {
      width: toDimension(source.innerWidth),
      height: toDimension(source.innerHeight),
    },
    appVersion: source.appVersion.slice(0, APP_VERSION_MAX_LENGTH),
  }
}
