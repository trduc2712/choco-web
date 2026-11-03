import 'i18next'

import type { defaultNS, fallbackLanguage, resources } from './i18n'
import type designSystem from './locales/en/design-system.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)[typeof fallbackLanguage] & {
      designSystem: typeof designSystem
    }
  }
}
