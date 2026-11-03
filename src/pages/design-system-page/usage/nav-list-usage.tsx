import { useTranslation } from 'react-i18next'

import { NavList } from '@/components'

export function NavListUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <NavList
      label={t('samples.mainNav')}
      sections={[
        {
          id: 'main',
          items: [
            {
              id: 'home',
              label: t('samples.home'),
              icon: 'home',
              to: '/',
              isEnd: true,
            },
            {
              id: 'inbox',
              label: t('samples.inbox'),
              icon: 'inbox',
              to: '/inbox',
              count: 4,
            },
          ],
        },
      ]}
    />
  )
}
