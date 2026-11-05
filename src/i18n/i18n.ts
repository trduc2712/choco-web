import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import { FALLBACK_LANGUAGE, type Language, LANGUAGES } from './languages'
import enCommon from './locales/en/common.json'
import jaCommon from './locales/ja/common.json'

export const defaultNS = 'common'
export const fallbackLanguage = FALLBACK_LANGUAGE

export const resources = {
  en: { common: enCommon },
  ja: { common: jaCommon satisfies typeof enCommon },
} as const satisfies Record<Language, { common: typeof enCommon }>

export const LANGUAGE_STORAGE_KEY = 'language'

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: fallbackLanguage,
    supportedLngs: LANGUAGES,
    load: 'languageOnly',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
  })

export { i18n }
