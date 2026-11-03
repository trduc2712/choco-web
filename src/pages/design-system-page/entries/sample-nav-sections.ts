import { useTranslation } from 'react-i18next'

import type { NavListSection } from '@/components'

import { getEntryPath } from '../showcase-entries'

export function useSampleNavSections(): NavListSection[] {
  const { t } = useTranslation('designSystem')

  return [
    {
      id: 'main',
      items: [
        {
          id: 'home',
          label: t('samples.home'),
          icon: 'home',
          to: getEntryPath('button'),
        },
        {
          id: 'inbox',
          label: t('samples.inbox'),
          icon: 'inbox',
          to: getEntryPath('nav-list'),
          count: 4,
        },
      ],
    },
    {
      id: 'shop',
      title: t('samples.shop'),
      items: [
        {
          id: 'products',
          label: t('samples.products'),
          icon: 'package',
          items: [
            {
              id: 'all',
              label: t('samples.allProducts'),
              to: getEntryPath('table'),
            },
            {
              id: 'new',
              label: t('samples.newProduct'),
              to: getEntryPath('form'),
            },
          ],
        },
        {
          id: 'settings',
          label: t('samples.settings'),
          icon: 'settings',
          to: getEntryPath('sidebar'),
        },
      ],
    },
  ]
}
