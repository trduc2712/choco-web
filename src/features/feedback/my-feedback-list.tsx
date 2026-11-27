import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { ApiError } from '@/lib/api-client'

import {
  CATEGORY_BADGES,
  formatDateTime,
  STATUS_BADGES,
} from './feedback-format'
import { useMyFeedback } from './my-feedback-api'

// What the viewer sent: the category, the message, where it stands and when it
// was sent, newest first, with a button for the next page.
export function MyFeedbackList() {
  const { t, i18n } = useTranslation()
  const feedback = useMyFeedback()
  const items = feedback.data?.pages.flatMap((page) => page.items) ?? []
  const status =
    feedback.error instanceof ApiError ? feedback.error.status : undefined

  if (feedback.isPending) {
    return <MyFeedbackSkeletons />
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
    <Card>
      <ul>
        {items.map((item) => {
          const category = CATEGORY_BADGES[item.category]
          const statusBadge = STATUS_BADGES[item.status]
          return (
            <li key={item.id}>
              <div>
                <Badge icon={category.icon} tone={category.tone}>
                  {t(`feedback.categories.${item.category}`)}
                </Badge>
                <Badge icon={statusBadge.icon} tone={statusBadge.tone}>
                  {t(`feedback.mine.statuses.${item.status}`)}
                </Badge>
              </div>
              <Text>{item.message}</Text>
              <Text as="span" size="sm" tone="muted">
                <time dateTime={item.createdAt}>
                  {formatDateTime(item.createdAt, i18n.language)}
                </time>
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

// Stands in for the list while its first page loads: the same card and rows,
// with two badges, a line of message and the date in each.
export function MyFeedbackSkeletons({ count = 4 }: { count?: number }) {
  const { t } = useTranslation()
  return (
    <Card role="status">
      <VisuallyHidden>{t('feedback.mine.loading')}</VisuallyHidden>
      <ul aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <div>
              {['var(--space-8)', 'var(--space-9)'].map((width) => (
                <Skeleton
                  key={width}
                  shape="rect"
                  width={width}
                  height="var(--size-badge-sm)"
                />
              ))}
            </div>
            <Text as="div">
              <Skeleton width="var(--size-measure-md)" />
            </Text>
            <Text as="div" size="sm">
              <Skeleton width="var(--space-9)" />
            </Text>
          </li>
        ))}
      </ul>
    </Card>
  )
}
