import { useTranslation } from 'react-i18next'

import type { HoverCardPlacement } from '@/components'
import { Avatar, HoverCard, Link, Stack, Text } from '@/components'

import { getEntryPath } from '../showcase-entries'
import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const PLACEMENTS: HoverCardPlacement[] = ['bottom', 'top-start', 'right']

export function HoverCardEntry() {
  const { t } = useTranslation('designSystem')
  const card = (
    <Stack direction="row" gap={3}>
      <Avatar name={t('samples.personName')} />
      <Stack gap={1}>
        <Text weight="semibold">{t('samples.personName')}</Text>
        <Text tone="muted" size="sm">
          {t('samples.hoverCardBio')}
        </Text>
      </Stack>
    </Stack>
  )

  return (
    <ShowcaseSection title={t('sections.placement')}>
      <SpecimenRow>
        {PLACEMENTS.map((placement) => (
          <Specimen key={placement} label={placement}>
            <HoverCard
              placement={placement}
              trigger={
                <Link to={getEntryPath('avatar')}>
                  {t('samples.personName')}
                </Link>
              }
            >
              {card}
            </HoverCard>
          </Specimen>
        ))}
      </SpecimenRow>
    </ShowcaseSection>
  )
}
