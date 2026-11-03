import { useTranslation } from 'react-i18next'

import type { TabItem } from '@/components'
import { Tabs, Text } from '@/components'

const NUMBERS = [1, 2, 3]

export function TabsUsage() {
  const { t } = useTranslation('designSystem')
  const items: TabItem[] = NUMBERS.map((number) => ({
    id: String(number),
    label: t('samples.tab', { number }),
    content: <Text>{t('samples.panel', { number })}</Text>,
  }))

  return <Tabs label={t('samples.tabsLabel')} items={items} />
}
