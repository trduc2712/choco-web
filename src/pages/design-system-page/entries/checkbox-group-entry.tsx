import { useTranslation } from 'react-i18next'

import type { CheckboxGroupOption } from '@/components'
import { CheckboxGroup } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function CheckboxGroupEntry() {
  const { t } = useTranslation('designSystem')
  const options: CheckboxGroupOption[] = [
    { value: 'email', label: t('samples.channelEmail') },
    {
      value: 'sms',
      label: t('samples.channelSms'),
      hint: t('samples.optionHint'),
    },
    { value: 'push', label: t('samples.channelPush'), isDisabled: true },
  ]

  return (
    <>
      <ShowcaseSection title={t('sections.orientation')}>
        <Specimen label="vertical">
          <CheckboxGroup
            label={t('samples.channelsLabel')}
            name="channels-vertical"
            options={options}
            defaultValue={['email']}
          />
        </Specimen>
        <Specimen label="horizontal">
          <CheckboxGroup
            label={t('samples.channelsLabel')}
            name="channels-horizontal"
            options={options}
            orientation="horizontal"
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.validation')}>
        <Specimen label="error">
          <CheckboxGroup
            label={t('samples.channelsLabel')}
            name="channels-error"
            options={options}
            hint={t('samples.fieldHint')}
            error={t('samples.channelsError')}
            isRequired
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
