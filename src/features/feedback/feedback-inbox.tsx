import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Highlight } from '@/components/highlight/highlight'
import { MessageBox } from '@/components/message-box/message-box'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { UserCard } from '@/components/user-card/user-card'
import { AdminPager, useAdminPaging } from '@/features/admin'
import { getPageCount } from '@/lib/page-response'
import { formatRelativeTime } from '@/lib/relative-time'

import type { FeedbackItem } from './feedback-admin-api'
import { FEEDBACK_STATUSES } from './feedback-admin-api'
import { FeedbackDetailDialog } from './feedback-detail-dialog'
import {
  authorName,
  CATEGORY_BADGES,
  formatDateTime,
  STATUS_TONES,
} from './feedback-format'
import styles from './feedback-inbox.module.scss'
import { useFeedbackInbox } from './feedback-inbox-api'
import {
  FEEDBACK_CATEGORIES,
  searchWords,
  toSearchText,
} from './feedback-schema'

const ALL = 'all'

function pick<T extends string>(
  values: readonly T[],
  value: string | null,
): T | undefined {
  return values.find((candidate) => candidate === value)
}

type Param = 'status' | 'category' | 'q' | 'author' | 'id'

// The admin list of what people sent through the feedback dialog. The filters,
// the page and the open item live in the URL, so a reload or a shared link
// keeps them.
export function FeedbackInbox() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = pick(FEEDBACK_STATUSES, searchParams.get('status'))
  const category = pick(FEEDBACK_CATEGORIES, searchParams.get('category'))
  const q = toSearchText(searchParams.get('q') ?? '') || undefined
  const author = toSearchText(searchParams.get('author') ?? '') || undefined
  const { page, pageSize, setPage, setPageSize } = useAdminPaging(
    'choco.admin.feedback.pageSize',
  )
  const openId = searchParams.get('id')
  const inbox = useFeedbackInbox({
    status,
    category,
    q,
    author,
    page,
    pageSize,
  })
  const items = inbox.data?.items ?? []
  const totalCount = inbox.data?.totalCount ?? 0
  const pageCount = getPageCount(totalCount, pageSize)
  const isFiltered =
    status !== undefined ||
    category !== undefined ||
    q !== undefined ||
    author !== undefined

  // Values of null (or "all") take the parameter out of the URL; page 1 is the
  // default, so it never shows. Changing a filter goes back to page 1.
  function setParams(changes: Partial<Record<Param, string | null>>) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        const all =
          'status' in changes ||
          'category' in changes ||
          'q' in changes ||
          'author' in changes
        if (all) next.delete('page')
        for (const [name, value] of Object.entries(changes)) {
          if (value === null || value === undefined || value === ALL) {
            next.delete(name)
          } else if (name === 'page' && value === '1') {
            next.delete(name)
          } else {
            next.set(name, value)
          }
        }
        return next
      },
      { replace: true },
    )
  }

  // After the last item of the last page is handled, that page is gone: step
  // back to the last page there is. Only a settled answer counts; the page that
  // was on screen stands in while the next one loads.
  const isSettled = inbox.data !== undefined && !inbox.isPlaceholderData
  useEffect(() => {
    if (isSettled && items.length === 0 && page > pageCount) {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (pageCount === 1) next.delete('page')
          else next.set('page', String(pageCount))
          return next
        },
        { replace: true },
      )
    }
  }, [isSettled, items.length, page, pageCount, setSearchParams])

  const columns: TableColumn<FeedbackItem>[] = [
    {
      id: 'message',
      header: t('admin.feedback.columns.message'),
      isRowHeader: true,
      search: {
        label: t('admin.feedback.search.message.label'),
        placeholder: t('admin.feedback.search.message.placeholder'),
        value: q ?? '',
        onChange: (value) => setParams({ q: toSearchText(value) || null }),
      },
      cell: (item) => (
        <MessageBox
          className={styles.message}
          lines={2}
          onClick={() => setParams({ id: item.id })}
        >
          <Highlight text={item.message} query={searchWords(q ?? '')} />
        </MessageBox>
      ),
    },
    {
      id: 'user',
      header: t('admin.feedback.columns.from'),
      search: {
        label: t('admin.feedback.search.author.label'),
        placeholder: t('admin.feedback.search.author.placeholder'),
        value: author ?? '',
        onChange: (value) => setParams({ author: toSearchText(value) || null }),
      },
      cell: (item) =>
        item.author ? (
          <UserCard
            className={styles.user}
            name={authorName(item.author)}
            description={`@${item.author.username}`}
            highlight={author ?? ''}
            shape="square"
            isTruncated
          />
        ) : (
          <UserCard
            className={styles.user}
            name={t('admin.feedback.authorDeleted')}
            shape="square"
            isTruncated
          />
        ),
    },
    {
      id: 'category',
      header: t('admin.feedback.columns.category'),
      filter: {
        label: t('admin.feedback.filters.category'),
        value: category,
        options: FEEDBACK_CATEGORIES.map((value) => ({
          value,
          label: t(`feedback.categories.${value}`),
          icon: CATEGORY_BADGES[value].icon,
        })),
        onChange: (value) => setParams({ category: value ?? null }),
      },
      cell: (item) => {
        const { icon, tone } = CATEGORY_BADGES[item.category]
        return (
          <Badge icon={icon} tone={tone}>
            {t(`feedback.categories.${item.category}`)}
          </Badge>
        )
      },
    },
    {
      id: 'status',
      header: t('admin.feedback.columns.status'),
      filter: {
        label: t('admin.feedback.filters.status'),
        value: status,
        options: FEEDBACK_STATUSES.map((value) => ({
          value,
          label: t(`admin.feedback.statuses.${value}`),
        })),
        onChange: (value) => setParams({ status: value ?? null }),
      },
      cell: (item) => (
        <Badge tone={STATUS_TONES[item.status]}>
          {t(`admin.feedback.statuses.${item.status}`)}
        </Badge>
      ),
    },
    {
      id: 'received',
      header: t('admin.feedback.columns.received'),
      align: 'end',
      cell: (item) => (
        <time
          className={styles.time}
          dateTime={item.createdAt}
          title={formatRelativeTime(item.createdAt, i18n.language)}
        >
          {formatDateTime(item.createdAt, i18n.language)}
        </time>
      ),
    },
  ]

  return (
    <div className={styles.root}>
      {inbox.isError ? (
        <EmptyState
          size="sm"
          role="alert"
          icon="alert-circle"
          title={t('admin.feedback.loadError')}
          action={
            <Button variant="secondary" onClick={() => void inbox.refetch()}>
              {t('admin.feedback.retry')}
            </Button>
          }
        />
      ) : (
        <Table
          caption={t('admin.feedback.tableCaption')}
          isCaptionHidden
          columns={columns}
          rows={items}
          getRowId={(item) => item.id}
          isLoading={inbox.isPending}
          emptyState={
            <EmptyState
              size="sm"
              role="status"
              icon="message-smile"
              title={t('admin.feedback.empty')}
              description={
                isFiltered
                  ? t('admin.feedback.emptyFiltered')
                  : t('admin.feedback.emptyHint')
              }
            />
          }
        />
      )}

      {totalCount > 0 && items.length > 0 ? (
        <AdminPager
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          itemCount={items.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      ) : null}

      <FeedbackDetailDialog
        id={openId}
        listItem={items.find((item) => item.id === openId)}
        onClose={() => setParams({ id: null })}
      />
    </div>
  )
}
