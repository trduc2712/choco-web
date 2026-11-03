import { useTranslation } from 'react-i18next'

import { ThemeToggle } from '@/features/theme/theme-toggle'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function ThemeToggleEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Specimen label="ThemeToggle">
        <ThemeToggle />
      </Specimen>
    </ShowcaseSection>
  )
}
