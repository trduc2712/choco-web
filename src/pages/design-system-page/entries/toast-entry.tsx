import { useTranslation } from 'react-i18next'

import type { ToastTone } from '@/components'
import { Button, useToast } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const TONES: ToastTone[] = ['info', 'success', 'warning', 'danger']

export function ToastEntry() {
  const { t } = useTranslation('designSystem')
  const { showToast } = useToast()

  return (
    <>
      <ShowcaseSection title={t('sections.tones')}>
        <SpecimenRow>
          {TONES.map((tone) => (
            <Specimen key={tone} label={tone}>
              <Button
                variant="secondary"
                onClick={() =>
                  showToast({
                    tone,
                    title: t('samples.toastTitle'),
                    description: t('samples.toastBody'),
                  })
                }
              >
                {t('samples.showToast')}
              </Button>
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <SpecimenRow>
          <Specimen label="title only">
            <Button
              variant="secondary"
              onClick={() => showToast({ title: t('samples.toastTitle') })}
            >
              {t('samples.showToast')}
            </Button>
          </Specimen>
          <Specimen label="duration: null">
            <Button
              variant="secondary"
              onClick={() =>
                showToast({
                  title: t('samples.toastTitle'),
                  description: t('samples.toastBody'),
                  duration: null,
                })
              }
            >
              {t('samples.showToast')}
            </Button>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
    </>
  )
}
