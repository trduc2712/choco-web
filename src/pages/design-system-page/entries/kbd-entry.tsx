import { useTranslation } from 'react-i18next'

import { Kbd, Stack, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function KbdEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Specimen label="kbd">
        <Kbd>{t('samples.key')}</Kbd>
      </Specimen>
      <Specimen label="kbd + kbd">
        <Stack direction="row" gap={1} align="center">
          <Kbd>{t('samples.keyModifier')}</Kbd>
          <Text as="span" tone="muted">
            +
          </Text>
          <Kbd>{t('samples.key')}</Kbd>
        </Stack>
      </Specimen>
    </ShowcaseSection>
  )
}
