import { useTranslation } from 'react-i18next'

import type { DescriptionListItem } from '@/components'
import { DescriptionList } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function DescriptionListEntry() {
  const { t } = useTranslation('designSystem')
  const items: DescriptionListItem[] = [
    {
      id: 'username',
      term: t('samples.usernameTerm'),
      description: 'username',
    },
    {
      id: 'email',
      term: t('samples.emailTerm'),
      description: 'user@example.com',
    },
    {
      id: 'phone',
      term: t('samples.phoneTerm'),
      description: '+1 555-0100',
    },
  ]

  return (
    <ShowcaseSection title={t('sections.variants')}>
      <Specimen label="inline + isDivided" isStretched>
        <div className={styles.narrow}>
          <DescriptionList items={items} isDivided />
        </div>
      </Specimen>
      <Specimen label="stacked" isStretched>
        <div className={styles.narrow}>
          <DescriptionList items={items} layout="stacked" />
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
