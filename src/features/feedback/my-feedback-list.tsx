import { useTranslation } from 'react-i18next'

import { ApiError } from '@/lib/api-client'

import { formatDateTime } from './feedback-format'
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
      <section role="alert">
        <h2>
          {t(
            status === 401 ? 'profile.sessionError' : 'feedback.mine.loadError',
          )}
        </h2>
        {
          <button
            type="button"
            aria-busy={feedback.isFetching || undefined}
            disabled={feedback.isFetching}
            onClick={() => void feedback.refetch()}
          >
            {t('common.retry')}
          </button>
        }
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section role="status">
        <h2>{t('feedback.mine.empty')}</h2>
        <p>{t('feedback.mine.emptyHint')}</p>
      </section>
    )
  }

  return (
    <div>
      <ul>
        {items.map((item) => {
          return (
            <li key={item.id}>
              <div>
                <span>{t(`feedback.categories.${item.category}`)}</span>
                <span>{t(`feedback.mine.statuses.${item.status}`)}</span>
              </div>
              <p>{item.message}</p>
              <span>
                <time dateTime={item.createdAt}>
                  {formatDateTime(item.createdAt, i18n.language)}
                </time>
              </span>
            </li>
          )
        })}
      </ul>
      {feedback.isError ? (
        <div role="alert">{t('feedback.mine.moreError')}</div>
      ) : null}
      {feedback.hasNextPage ? (
        <button
          type="button"
          aria-busy={feedback.isFetchingNextPage || undefined}
          disabled={feedback.isFetchingNextPage}
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
        </button>
      ) : null}
    </div>
  )
}

// Stands in for the list while its first page loads: the same card and rows,
// with two badges, a line of message and the date in each.
export function MyFeedbackSkeletons({ count = 4 }: { count?: number }) {
  const { t } = useTranslation()
  return (
    <div role="status">
      <span className="visually-hidden">{t('feedback.mine.loading')}</span>
      <ul aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <div>
              {[0, 1].map((index) => (
                <span aria-hidden="true" key={index}>
                  &hellip;
                </span>
              ))}
            </div>
            <div>
              <span aria-hidden="true">&hellip;</span>
            </div>
            <div>
              <span aria-hidden="true">&hellip;</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
