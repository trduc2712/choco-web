import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { ApiError } from '@/lib/api-client'

import {
  CATEGORY_BADGES,
  formatDateTime,
  STATUS_BADGES,
} from './feedback-format'
import { useMyFeedback } from './my-feedback-api'
import styles from './my-feedback-list.module.scss'

// What the viewer sent: the category, the message, where it stands and when it
// was sent, newest first, with a button for the next page.
export function MyFeedbackList() {
  const { t, i18n } = useTranslation()
  const feedback = useMyFeedback()
  const items = feedback.data?.pages.flatMap((page) => page.items) ?? []
  const status =
    feedback.error instanceof ApiError ? feedback.error.status : undefined

  if (feedback.isPending) {
    return (
      <div className={styles.center}>
        <Spinner tone="primary" label={t('feedback.mine.loading')} />
      </div>
    )
  }

  if (!feedback.data) {
    return (
      <EmptyState
        size="sm"
        role="alert"
        icon="alert-circle"
        title={t(
          status === 401 ? 'profile.sessionError' : 'feedback.mine.loadError',
        )}
        action={
          <Button
            variant="secondary"
            isLoading={feedback.isFetching}
            onClick={() => void feedback.refetch()}
          >
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        size="sm"
        role="status"
        icon="message"
        title={t('feedback.mine.empty')}
        description={t('feedback.mine.emptyHint')}
      />
    )
  }

  return (
    <Card className={styles.card}>
      <ul className={styles.list}>
        {items.map((item) => {
          const category = CATEGORY_BADGES[item.category]
          const statusBadge = STATUS_BADGES[item.status]
          return (
            <li key={item.id} className={styles.item}>
              <div className={styles.meta}>
                <Badge icon={category.icon} tone={category.tone}>
                  {t(`feedback.categories.${item.category}`)}
                </Badge>
                <Badge icon={statusBadge.icon} tone={statusBadge.tone}>
                  {t(`feedback.mine.statuses.${item.status}`)}
                </Badge>
              </div>
              <Text className={styles.message}>{item.message}</Text>
              <Text as="time" size="sm" tone="muted" dateTime={item.createdAt}>
                {formatDateTime(item.createdAt, i18n.language)}
              </Text>
            </li>
          )
        })}
      </ul>
      {feedback.isError ? (
        <Alert tone="danger" role="alert">
          {t('feedback.mine.moreError')}
        </Alert>
      ) : null}
      {feedback.hasNextPage ? (
        <Button
          className={styles.more}
          variant="secondary"
          isLoading={feedback.isFetchingNextPage}
          onClick={() => {
            if (feedback.isFetching) return
            void feedback.fetchNextPage({ cancelRefetch: false })
          }}
        >
          {t(
            feedback.isFetchNextPageError
              ? 'common.retry'
              : 'feedback.mine.loadMore',
          )}
        </Button>
      ) : null}
    </Card>
  )
}
