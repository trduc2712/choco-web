import { useTranslation } from 'react-i18next'

import { PinInput, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function PinInputEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Stack gap={5}>
          <Specimen label="length 6">
            <PinInput
              label={t('samples.codeLabel')}
              hint={t('samples.codeHint')}
            />
          </Specimen>
          <Specimen label="length 4, alphanumeric">
            <PinInput
              label={t('samples.codeLabel')}
              length={4}
              type="alphanumeric"
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.masked')}>
        <Specimen label="isMasked">
          <PinInput
            label={t('samples.codeLabel')}
            length={4}
            defaultValue="12"
            isMasked
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.validation')}>
        <Specimen label="error">
          <PinInput
            label={t('samples.codeLabel')}
            length={4}
            defaultValue="1234"
            error={t('samples.fieldError')}
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
