import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { AlertTone, AlertVariant } from '@/components'
import { Alert, Button, Link } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'

import { ShowcaseSection, Specimen } from '../showcase-section'

const TONES: AlertTone[] = ['info', 'success', 'warning', 'danger']
const VARIANTS: AlertVariant[] = ['subtle', 'outline']

export function AlertEntry() {
  const { t } = useTranslation('designSystem')
  const [isDismissed, setIsDismissed] = useState(false)

  return (
    <>
      {VARIANTS.map((variant) => (
        <ShowcaseSection
          key={variant}
          title={`${t('sections.tones')} (${variant})`}
        >
          {TONES.map((tone) => (
            <Specimen key={tone} label={`${variant} / ${tone}`} isStretched>
              <Alert
                tone={tone}
                variant={variant}
                title={t('samples.alertTitle')}
              >
                {t('samples.alertBody')}
              </Alert>
            </Specimen>
          ))}
        </ShowcaseSection>
      ))}
      <ShowcaseSection title={t('sections.minimal')}>
        <Specimen label="title" isStretched>
          <Alert title={t('samples.alertTitle')} />
        </Specimen>
        <Specimen label="children" isStretched>
          <Alert tone="warning">
            {t('samples.alertBody')}{' '}
            <Link to={DESIGN_SYSTEM_PATH}>{t('samples.internalLink')}</Link>
          </Alert>
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.dismissible')}>
        <Specimen label="onDismiss" isStretched>
          {isDismissed ? (
            <Button variant="secondary" onClick={() => setIsDismissed(false)}>
              {t('samples.showToast')}
            </Button>
          ) : (
            <Alert
              tone="success"
              title={t('samples.toastTitle')}
              onDismiss={() => setIsDismissed(true)}
            >
              {t('samples.toastBody')}
            </Alert>
          )}
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
