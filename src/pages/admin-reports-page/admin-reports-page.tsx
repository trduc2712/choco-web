import { AdminPageHeader } from '@/features/admin'
import { ReportsQueue } from '@/features/reports'

export function AdminReportsPage() {
  return (
    <section>
      <AdminPageHeader screen="reports" />
      <ReportsQueue />
    </section>
  )
}
