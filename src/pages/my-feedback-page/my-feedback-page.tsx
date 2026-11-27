import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { MyFeedbackList } from '@/features/feedback'

export function MyFeedbackPage() {
  const { t } = useTranslation()
  return (
    <section>
      <Heading level={1}>{t('feedback.mine.title')}</Heading>
      <MyFeedbackList />
    </section>
  )
}
