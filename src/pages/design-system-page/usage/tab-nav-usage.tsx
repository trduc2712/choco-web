import { useTranslation } from 'react-i18next'

import { TabNav } from '@/components'

export function TabNavUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <TabNav
      label={t('samples.mainNav')}
      items={[
        { id: 'home', label: t('samples.home'), to: '/', isEnd: true },
        { id: 'inbox', label: t('samples.inbox'), to: '/inbox', count: 4 },
        { id: 'settings', label: t('samples.settings'), to: '/settings' },
      ]}
    />
  )
}
