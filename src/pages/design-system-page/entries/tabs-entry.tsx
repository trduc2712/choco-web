import { useTranslation } from 'react-i18next'

import type { TabsVariant } from '@/components'
import { Tabs, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const VARIANTS: TabsVariant[] = ['line', 'pill']
const NUMBERS = [1, 2, 3]

export function TabsEntry() {
  const { t } = useTranslation('designSystem')
  const items = NUMBERS.map((number) => ({
    id: String(number),
    label: t('samples.tab', { number }),
    content: <Text>{t('samples.panel', { number })}</Text>,
  }))

  return (
    <>
      <ShowcaseSection title={t('sections.variants')}>
        {VARIANTS.map((variant) => (
          <Specimen key={variant} label={variant} isStretched>
            <Tabs
              label={`${t('samples.tabsLabel')} (${variant})`}
              items={items}
              variant={variant}
            />
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Specimen label="isDisabled" isStretched>
          <Tabs
            label={t('sections.states')}
            items={items.map((item, index) => ({
              ...item,
              isDisabled: index === 1,
            }))}
          />
        </Specimen>
        <Specimen label="defaultValue" isStretched>
          <Tabs label={t('sections.default')} items={items} defaultValue="3" />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
