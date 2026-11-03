import { useTranslation } from 'react-i18next'

import { Fieldset, Input } from '@/components'

export function FieldsetUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Fieldset legend={t('samples.fieldsetLegend')} isRequired>
      <Input label={t('samples.streetLabel')} required />
      <Input label={t('samples.cityLabel')} required />
    </Fieldset>
  )
}
