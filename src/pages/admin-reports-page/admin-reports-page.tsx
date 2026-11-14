import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Tabs } from '@/components/tabs/tabs'
import { AdminPageHeader } from '@/features/admin'
import { AdminReportsList, ReportsQueue } from '@/features/reports'

export function AdminReportsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useSearchParams()
  const view = search.get('view') === 'all' ? 'all' : 'queue'

  return (
    <section>
      <AdminPageHeader screen="reports" />
      <Tabs
        label={t('admin.reports.views.label')}
        value={view}
        items={[
          {
            id: 'queue',
            label: t('admin.reports.views.queue'),
            content: <ReportsQueue />,
          },
          {
            id: 'all',
            label: t('admin.reports.all.title'),
            content: <AdminReportsList />,
          },
        ]}
        onChange={(next) => {
          if (next !== view) setSearch(next === 'all' ? { view: 'all' } : {})
        }}
      />
    </section>
  )
}
