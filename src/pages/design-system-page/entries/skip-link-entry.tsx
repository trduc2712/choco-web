import { useTranslation } from 'react-i18next'

import { SkipLink, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const TARGET_ID = 'skip-link-sample-target'

export function SkipLinkEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Specimen label="targetId" isStretched>
        <Text tone="muted" size="sm">
          {t('samples.skipLinkNote')}
        </Text>
        <SkipLink targetId={TARGET_ID} />
        <div id={TARGET_ID} className={styles.block}>
          {t('samples.mainContent')}
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
