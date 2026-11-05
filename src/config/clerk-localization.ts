import { enUS, jaJP } from '@clerk/localizations'
import type { ClerkProviderProps } from '@clerk/react'

import type { Language } from '@/i18n/languages'

/** The text Clerk renders itself, such as its bot protection challenge. */
export const clerkLocalizations: Record<
  Language,
  ClerkProviderProps['localization']
> = {
  en: enUS,
  ja: jaJP,
}
