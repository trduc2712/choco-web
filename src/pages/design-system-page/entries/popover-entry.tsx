import { useTranslation } from 'react-i18next'

import type { PopoverPlacement } from '@/components'
import { Button, CopyButton, Popover, Stack, Text } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const PLACEMENTS: PopoverPlacement[] = [
  'bottom-start',
  'bottom-end',
  'top',
  'right',
]

export function PopoverEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.placement')}>
      <SpecimenRow>
        {PLACEMENTS.map((placement) => (
          <Specimen key={placement} label={placement}>
            <Popover
              title={t('samples.popoverTitle')}
              placement={placement}
              trigger={
                <Button variant="secondary" iconStart="share">
                  {t('samples.share')}
                </Button>
              }
            >
              <Stack gap={3}>
                <Text tone="muted" size="sm">
                  {t('samples.popoverBody')}
                </Text>
                <CopyButton
                  value="https://example.com/share"
                  label={t('samples.copyLink')}
                  variant="secondary"
                  isLabelShown
                />
              </Stack>
            </Popover>
          </Specimen>
        ))}
      </SpecimenRow>
    </ShowcaseSection>
  )
}
