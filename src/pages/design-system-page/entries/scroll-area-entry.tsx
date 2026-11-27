import { useTranslation } from 'react-i18next'

import { ScrollArea, Stack, Tag } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const NUMBERS = Array.from({ length: 16 }, (_, index) => index + 1)

export function ScrollAreaEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.orientation')}>
      <Specimen label="vertical" isStretched>
        <div>
          <ScrollArea label={t('samples.activity')} maxHeight="12rem">
            <Stack gap={2}>
              {NUMBERS.map((number) => (
                <div key={number}>{t('samples.activityEntry', { number })}</div>
              ))}
            </Stack>
          </ScrollArea>
        </div>
      </Specimen>
      <Specimen label="horizontal" isStretched>
        <div>
          <ScrollArea label={t('samples.tagsLabel')} orientation="horizontal">
            <Stack direction="row" gap={2}>
              {NUMBERS.map((number) => (
                <Tag key={number} label={t('samples.gridItem', { number })} />
              ))}
            </Stack>
          </ScrollArea>
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
