import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

import { Breadcrumb } from '@/components/breadcrumb/breadcrumb'
import { ADMIN_PATH } from '@/constants/routes'

import { ADMIN_SCREENS } from './admin-screens'

// Where the viewer is in the admin area, for the top bar.
export function AdminBreadcrumb({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const screen = ADMIN_SCREENS.find(
    (entry) => pathname === entry.to || pathname.startsWith(`${entry.to}/`),
  )

  return (
    <Breadcrumb
      className={className}
      items={[
        { label: t('admin.title'), to: ADMIN_PATH },
        ...(screen ? [{ label: t(`admin.screens.${screen.id}`) }] : []),
      ]}
    />
  )
}
