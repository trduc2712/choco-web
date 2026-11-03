import { useTranslation } from 'react-i18next'

import type { TooltipPlacement } from '@/components'
import { Button, Tooltip } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const PLACEMENTS: TooltipPlacement[] = ['top', 'bottom']

export function TooltipEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.placement')}>
        <SpecimenRow>
          {PLACEMENTS.map((placement) => (
            <Specimen key={placement} label={placement}>
              <Tooltip content={t('samples.tooltip')} placement={placement}>
                <Button variant="secondary">{t('samples.copyLink')}</Button>
              </Tooltip>
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.iconOnly')}>
        <Specimen label="icon">
          <Tooltip content={t('samples.tooltip')}>
            <Button
              icon="link"
              variant="ghost"
              aria-label={t('samples.copyLink')}
            />
          </Tooltip>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
