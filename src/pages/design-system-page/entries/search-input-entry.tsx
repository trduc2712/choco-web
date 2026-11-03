import { useTranslation } from 'react-i18next'

import { SearchInput, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function SearchInputEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Stack gap={5} className={styles.narrow}>
        <Specimen label="empty" isStretched>
          <SearchInput
            label={t('samples.searchOrders')}
            placeholder={t('samples.searchPlaceholder')}
          />
        </Specimen>
        <Specimen label="with value" isStretched>
          <SearchInput
            label={t('samples.searchOrders')}
            defaultValue="order-id"
          />
        </Specimen>
        <Specimen label="isLabelHidden" isStretched>
          <SearchInput
            label={t('samples.searchOrders')}
            placeholder={t('samples.searchOrders')}
            isLabelHidden
            size="sm"
          />
        </Specimen>
      </Stack>
    </ShowcaseSection>
  )
}
