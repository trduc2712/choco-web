import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Stepper } from '@/components'

export function StepperUsage() {
  const { t } = useTranslation('designSystem')
  const [current, setCurrent] = useState(1)

  return (
    <Stepper
      currentIndex={current}
      onStepClick={setCurrent}
      steps={[
        { id: 'cart', label: t('samples.stepCart') },
        { id: 'shipping', label: t('samples.stepShipping') },
        { id: 'payment', label: t('samples.stepPayment') },
      ]}
    />
  )
}
