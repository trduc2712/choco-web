import { useTranslation } from 'react-i18next'

import { NavList, Sidebar } from '@/components'

export function SidebarUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Sidebar label={t('samples.workspace')} isCollapsible>
      {({ isCollapsed }) => (
        <NavList
          label={t('samples.mainNav')}
          isCollapsed={isCollapsed}
          sections={[
            {
              id: 'main',
              items: [
                { id: 'home', label: t('samples.home'), icon: 'home', to: '/' },
              ],
            },
          ]}
        />
      )}
    </Sidebar>
  )
}
