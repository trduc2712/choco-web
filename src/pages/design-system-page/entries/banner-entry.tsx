import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { BannerTone } from '@/components'
import { Banner, Button, Link, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const TONES: BannerTone[] = ['info', 'success', 'warning', 'danger', 'primary']

export function BannerEntry() {
  const { t } = useTranslation('designSystem')
  const [isShown, setIsShown] = useState(true)

  return (
    <>
      <ShowcaseSection title={t('sections.tones')}>
        <Stack gap={3}>
          {TONES.map((tone) => (
            <Specimen key={tone} label={tone} isStretched>
              <Banner tone={tone} label={`${tone} ${t('samples.bannerTitle')}`}>
                {t('samples.bannerBody')}
              </Banner>
            </Specimen>
          ))}
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.dismissible')}>
        <Specimen label="title + action + onDismiss" isStretched>
          {isShown ? (
            <Banner
              tone="primary"
              title={t('samples.bannerLaunch')}
              action={
                <Link href="https://example.com">{t('samples.learnMore')}</Link>
              }
              onDismiss={() => setIsShown(false)}
            >
              {t('samples.bannerBody')}
            </Banner>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsShown(true)}
            >
              {t('samples.showBanner')}
            </Button>
          )}
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
