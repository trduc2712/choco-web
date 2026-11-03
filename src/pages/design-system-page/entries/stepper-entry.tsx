import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { StepperStep } from '@/components'
import { Button, Stack, Stepper } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function StepperEntry() {
  const { t } = useTranslation('designSystem')
  const [current, setCurrent] = useState(1)
  const steps: StepperStep[] = [
    { id: 'cart', label: t('samples.stepCart') },
    {
      id: 'shipping',
      label: t('samples.stepShipping'),
      description: t('samples.stepShippingHint'),
    },
    { id: 'payment', label: t('samples.stepPayment') },
    { id: 'review', label: t('samples.stepReview') },
  ]

  return (
    <>
      <ShowcaseSection title={t('sections.interactive')}>
        <Specimen label="onStepClick" isStretched>
          <Stack gap={4}>
            <Stepper
              steps={steps}
              currentIndex={current}
              label={t('samples.checkoutProgress')}
              onStepClick={setCurrent}
            />
            <Stack direction="row" gap={2}>
              <Button
                variant="secondary"
                size="sm"
                disabled={current === 0}
                onClick={() => setCurrent((index) => index - 1)}
              >
                {t('samples.back')}
              </Button>
              <Button
                size="sm"
                disabled={current === steps.length - 1}
                onClick={() => setCurrent((index) => index + 1)}
              >
                {t('samples.continue')}
              </Button>
            </Stack>
          </Stack>
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.orientation')}>
        <Specimen label="vertical">
          <Stepper
            steps={steps}
            currentIndex={2}
            orientation="vertical"
            label={t('samples.orderProgress')}
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
