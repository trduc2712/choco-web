import { AdminContentList, AdminPageHeader } from '@/features/admin'

export function AdminPage({ screen }: { screen: 'posts' }) {
  return (
    <section>
      <AdminPageHeader screen={screen} />
      <AdminContentList key={screen} kind={screen} />
    </section>
  )
}
