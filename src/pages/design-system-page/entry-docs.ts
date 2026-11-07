import { useTranslation } from 'react-i18next'

import enDocs from '@/i18n/locales/en/design-system-docs.json'
import jaDocs from '@/i18n/locales/ja/design-system-docs.json'
import viDocs from '@/i18n/locales/vi/design-system-docs.json'

export type PropDoc = {
  name: string
  type: string
  description: string
  default?: string
  required?: boolean
}

export type KeyboardDoc = {
  keys: string[]
  description: string
}

export type EntryDocs = {
  description: string
  whenToUse: string[]
  whenNotToUse: string[]
  accessibility: string[]
  keyboard?: KeyboardDoc[]
  props?: PropDoc[]
}

export type ShowcaseEntryId = keyof typeof enDocs

const DOCS: Record<string, Record<ShowcaseEntryId, EntryDocs>> = {
  en: enDocs,
  ja: jaDocs satisfies typeof enDocs,
  vi: viDocs satisfies typeof enDocs,
}

export function getEntryDocs(
  id: ShowcaseEntryId,
  language: string | undefined,
): EntryDocs {
  return (DOCS[language ?? 'en'] ?? DOCS.en)[id]
}

export function useEntryDocs(id: ShowcaseEntryId): EntryDocs {
  const { i18n } = useTranslation()

  return getEntryDocs(id, i18n.resolvedLanguage)
}
