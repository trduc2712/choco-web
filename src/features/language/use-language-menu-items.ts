import { useTranslation } from 'react-i18next'

import type { MenuSubmenuItem } from '@/components/menu/menu'
import { LANGUAGE_NAMES, LANGUAGES, toLanguage } from '@/i18n/languages'

/**
 * A "Language" item that shows the current language and opens the languages
 * as a submenu, each named in its own language. The choice is remembered.
 */
export function useLanguageSubmenuItem(): MenuSubmenuItem {
  const { t, i18n } = useTranslation()
  const language = toLanguage(i18n.resolvedLanguage)

  return {
    id: 'language',
    label: t('language.label'),
    icon: 'languages',
    value: LANGUAGE_NAMES[language],
    submenu: LANGUAGES.map((option) => ({
      id: `language-${option}`,
      label: LANGUAGE_NAMES[option],
      isChecked: language === option,
      onSelect: () => void i18n.changeLanguage(option),
    })),
  }
}
