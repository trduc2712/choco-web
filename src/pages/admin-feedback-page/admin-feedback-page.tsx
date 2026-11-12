import { useTranslation } from 'react-i18next'

import { AdminPageHeader, useAdminCounts } from '@/features/admin'
import { FeedbackInbox } from '@/features/feedback'

export function AdminFeedbackPage() {
  const { t } = useTranslation()
  const newFeedback = useAdminCounts().data?.newFeedback

  return (
    <section>
      <AdminPageHeader
        screen="feedback"
        summary={
          newFeedback
            ? t('admin.feedback.summaryNew', { count: newFeedback })
            : undefined
        }
      />
      <FeedbackInbox />
    </section>
  )
}
