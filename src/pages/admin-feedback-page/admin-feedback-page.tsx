import { AdminPageHeader } from '@/features/admin'
import { FeedbackInbox } from '@/features/feedback'

export function AdminFeedbackPage() {
  return (
    <section>
      <AdminPageHeader screen="feedback" />
      <FeedbackInbox />
    </section>
  )
}
