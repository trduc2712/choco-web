import { useTranslation } from 'react-i18next'

import type { TabNavItem } from '@/components'
import { TabNav } from '@/components'
import { Header } from '@/components/header/header'

import { getEntryPath } from '../showcase-entries'
import { ShowcaseSection, Specimen } from '../showcase-section'

export function TabNavEntry() {
  const { t } = useTranslation('designSystem')
  const items: TabNavItem[] = [
    { id: 'home', label: t('samples.home'), to: getEntryPath('button') },
    {
      id: 'inbox',
      label: t('samples.inbox'),
      to: getEntryPath('tab-nav'),
      count: 4,
    },
    {
      id: 'products',
      label: t('samples.products'),
      to: getEntryPath('table'),
      count: 120,
    },
    { id: 'settings', label: t('samples.settings'), to: getEntryPath('tabs') },
  ]

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Specimen label="items" isStretched>
          <TabNav label={t('samples.mainNav')} items={items} />
        </Specimen>
        <Specimen label="icon" isStretched>
          <TabNav
            label={`${t('samples.mainNav')} (icon)`}
            items={items.map((item, index) => ({
              ...item,
              icon: (['home', 'inbox', 'package', 'settings'] as const)[index],
            }))}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.inContext')}>
        <Specimen label="Header" isStretched>
          <Header>
            <TabNav
              label={`${t('samples.mainNav')} (Header)`}
              items={items}
              badgeShape="square"
            />
          </Header>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
