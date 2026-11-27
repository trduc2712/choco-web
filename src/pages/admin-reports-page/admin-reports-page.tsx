import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Heading } from '@/components/heading/heading'
import { Tabs } from '@/components/tabs/tabs'
import { AdminReportsList, ReportsQueue } from '@/features/reports'
import { cx } from '@/lib/cx'

export function AdminReportsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useSearchParams()
  const view = search.get('view') === 'all' ? 'all' : 'queue'

  return (
    <section
      className={cx(
        'admin-reports-page-root',
        view === 'queue' && 'admin-reports-page-fit',
      )}
    >
      <header>
        <Heading level={1} size="3xl">
          {t('admin.screens.reports')}
        </Heading>
      </header>
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
