import type { Theme } from '@/features/theme'

export const SUPPORTED_LOCALES = ['en', 'ja', 'vi'] as const

export type FeedbackLocale = (typeof SUPPORTED_LOCALES)[number]

export type FeedbackContext = {
  path: string
  locale: FeedbackLocale
  theme: Theme
  userAgent: string
  viewport: { width: number; height: number }
  appVersion: string
}

const USER_AGENT_MAX_LENGTH = 512
const APP_VERSION_MAX_LENGTH = 64

type ContextSource = {
  pathname: string
  language: string | undefined
  theme: Theme
  userAgent: string
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
export function buildFeedbackContext(source: ContextSource): FeedbackContext {
  return {
    path: source.pathname.split(/[?#]/)[0] || '/',
    locale: toLocale(source.language),
    theme: source.theme,
    userAgent: source.userAgent.slice(0, USER_AGENT_MAX_LENGTH),
    viewport: {
      width: toDimension(source.innerWidth),
      height: toDimension(source.innerHeight),
    },
    appVersion: source.appVersion.slice(0, APP_VERSION_MAX_LENGTH),
  }
}
