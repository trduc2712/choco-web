import { useTranslation } from 'react-i18next'

import { NavList } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'
import styles from './entries.module.scss'
import { useSampleNavSections } from './sample-nav-sections'

export function NavListEntry() {
  const { t } = useTranslation('designSystem')
  const sections = useSampleNavSections()

  return (
    <ShowcaseSection title={t('sections.nested')}>
      <SpecimenRow>
        <Specimen label="sections" isStretched>
          <div className={styles.navFrame}>
            <NavList label={t('samples.mainNav')} sections={sections} />
          </div>
        </Specimen>
        <Specimen label="isCollapsed">
          <NavList
            label={`${t('samples.mainNav')} (${t('sections.collapsed')})`}
            sections={sections}
            isCollapsed
          />
        </Specimen>
      </SpecimenRow>
    </ShowcaseSection>
  )
}
