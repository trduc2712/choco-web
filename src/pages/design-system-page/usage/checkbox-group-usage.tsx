import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CheckboxGroup } from '@/components'

export function CheckboxGroupUsage() {
  const { t } = useTranslation('designSystem')
  const [channels, setChannels] = useState(['email'])

  return (
    <CheckboxGroup
      label={t('samples.channelsLabel')}
      name="channels"
      value={channels}
      onChange={setChannels}
      options={[
        { value: 'email', label: t('samples.channelEmail') },
        { value: 'sms', label: t('samples.channelSms') },
      ]}
    />
  )
}
