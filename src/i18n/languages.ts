export const LANGUAGES = ['en', 'ja', 'vi'] as const

export type Language = (typeof LANGUAGES)[number]

export const FALLBACK_LANGUAGE: Language = 'en'

/** Each language's name in that language, as people look for it in a list. */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  ja: '日本語',
  vi: 'Tiếng Việt',
}

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.some((language) => language === value)
}

/** The supported language a language code resolves to, such as `ja-JP` → `ja`. */
export function toLanguage(code: string | undefined): Language {
  const base = code?.split('-')[0]

  return isLanguage(base) ? base : FALLBACK_LANGUAGE
}
