import { useTranslation } from 'react-i18next'

import type { DividerVariant } from '@/components'
import { Divider, Stack, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const VARIANTS: DividerVariant[] = ['solid', 'dashed']

export function DividerEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.variants')}>
        {VARIANTS.map((variant) => (
          <Specimen key={variant} label={variant} isStretched>
            <Divider variant={variant} />
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.orientation')}>
        <Specimen label="horizontal" isStretched>
          <Stack gap={3}>
            <Text>{t('samples.body')}</Text>
            <Divider />
            <Text>{t('samples.muted')}</Text>
          </Stack>
        </Specimen>
        <Specimen label="vertical">
          <Stack direction="row" gap={3} align="center" className={styles.row}>
            <Text>{t('samples.action')}</Text>
            <Divider orientation="vertical" />
            <Text>{t('samples.cancel')}</Text>
          </Stack>
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withLabel')}>
        {VARIANTS.map((variant) => (
          <Specimen key={variant} label={`label / ${variant}`} isStretched>
            <Divider label={t('samples.options')} variant={variant} />
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.semantic')}>
        <Specimen label="isDecorative={false}" isStretched>
          <Stack gap={3}>
            <Text>{t('samples.body')}</Text>
            <Divider isDecorative={false} />
            <Text>{t('samples.muted')}</Text>
          </Stack>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
