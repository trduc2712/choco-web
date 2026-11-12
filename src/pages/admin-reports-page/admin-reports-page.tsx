import { useTranslation } from 'react-i18next'

import { AdminPageHeader } from '@/features/admin'
import { ReportsQueue } from '@/features/reports'

export function AdminReportsPage() {
  const { t } = useTranslation()

  return (
    <section>
      <AdminPageHeader
        screen="reports"
        summary={t('admin.reports.queue.summary')}
      />
      <ReportsQueue />
    </section>
  )
}
