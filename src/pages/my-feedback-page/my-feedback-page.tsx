import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { MyFeedbackList } from '@/features/feedback'

import styles from './my-feedback-page.module.scss'

export function MyFeedbackPage() {
  const { t } = useTranslation()
  return (
    <section>
      <Heading level={1} className={styles.title}>
        {t('feedback.mine.title')}
      </Heading>
      <MyFeedbackList />
    </section>
  )
}
