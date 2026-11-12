import { useTranslation } from 'react-i18next'

import { EmptyState } from '@/components/empty-state/empty-state'
import type { AdminScreenId } from '@/features/admin'
import { ADMIN_SCREENS, AdminPageHeader } from '@/features/admin'

// Stands in for an admin screen until it is built, so the shell can be judged
// with a real header and nav entry.
export function AdminPage({ screen }: { screen: AdminScreenId }) {
  const { t } = useTranslation()
  const icon = ADMIN_SCREENS.find((entry) => entry.id === screen)?.icon

  return (
    <section>
      <AdminPageHeader screen={screen} />
      <EmptyState
        size="sm"
        icon={icon}
        title={t('admin.comingSoon')}
        description={t('admin.comingSoonHint')}
      />
    </section>
  )
}
