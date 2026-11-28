import 'i18next'

import type { defaultNS, fallbackLanguage, resources } from './i18n'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)[typeof fallbackLanguage]
  }
}
