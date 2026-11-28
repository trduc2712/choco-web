import { useTranslation } from 'react-i18next'

import { MyFeedbackList } from '@/features/feedback'

export function MyFeedbackPage() {
  const { t } = useTranslation()
  return (
    <section>
      <h1>{t('feedback.mine.title')}</h1>
      <MyFeedbackList />
    </section>
  )
}
