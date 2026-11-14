import type { MouseEvent } from 'react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Highlight } from '@/components/highlight/highlight'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { Text } from '@/components/text/text'
import {
  AdminFilterField,
  AdminPager,
  AdminSearchField,
  AdminToolbar,
  useAdminPaging,
} from '@/features/admin'
import { getPageCount } from '@/lib/page-response'
import { formatRelativeTime } from '@/lib/relative-time'

import type { FeedbackSummary } from './feedback-admin-api'
import { FEEDBACK_STATUSES } from './feedback-admin-api'
import { FeedbackAuthorLink } from './feedback-author-link'
import { FeedbackDetailDialog } from './feedback-detail-dialog'
import {
  CATEGORY_BADGES,
  formatDateTime,
  formatDateTimeUtc,
  formatDateTimeZone,
  STATUS_BADGES,
} from './feedback-format'
import styles from './feedback-inbox.module.scss'
import { useFeedbackInbox } from './feedback-inbox-api'
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_SEARCH_MAX_LENGTH,
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

  // The open feedback's place on this page, and among everything that matches:
  // the rows before this page, then its place on the page.
  const openIndex = items.findIndex((item) => item.id === openId)
  const openNumber = (page - 1) * pageSize + openIndex + 1

  function openClickedRow(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement
    if (target.closest('a, input, select, textarea, label')) return
    const row = target.closest('tbody tr')
    if (!row?.parentElement) return
    const item = items[Array.from(row.parentElement.children).indexOf(row)]
    if (item) setParams({ id: item.id })
  }

  const columns: TableColumn<FeedbackSummary>[] = [
    {
      id: 'message',
      header: t('admin.feedback.columns.message'),
      isRowHeader: true,
      // The start of the message, as plain text. It is a button only so the
      // keyboard can reach the row: a click on it, like a click anywhere else
      // on the row, is handled by the table's wrapper, not here.
      cell: (item) => (
        <button type="button" className={styles.message}>
          <Highlight text={item.messagePreview} query={searchWords(q ?? '')} />
        </button>
      ),
    },
    {
      id: 'user',
      header: t('admin.feedback.columns.from'),
      cell: (item) =>
        item.author ? (
          <FeedbackAuthorLink author={item.author} highlight={author ?? ''} />
        ) : (
          <Text as="span" size="sm" tone="muted">
            {t('admin.feedback.authorDeleted')}
          </Text>
        ),
    },
    {
      id: 'category',
      header: t('admin.feedback.columns.category'),
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
      cell: (item) => {
        const { icon, tone } = STATUS_BADGES[item.status]
        return (
          <Badge icon={icon} tone={tone}>
            {t(`admin.feedback.statuses.${item.status}`)}
          </Badge>
        )
      },
    },
    {
      id: 'received',
      header: t('admin.feedback.columns.received'),
      align: 'end',
      cell: (item) => (
        <time
          className={styles.time}
          dateTime={item.createdAt}
          title={`${formatDateTimeZone(item.createdAt, i18n.language)} (${t('admin.feedback.localTime')}) · ${formatDateTimeUtc(item.createdAt, i18n.language)} · ${formatRelativeTime(item.createdAt, i18n.language)}`}
        >
          {formatDateTime(item.createdAt, i18n.language)}
        </time>
      ),
    },
  ]

  return (
    // A click on a row, outside a link or a field, opens that feedback. The
    // rows come in the order of `items`, so a row's place is the feedback's. The
    // message button in each row is the keyboard's way in.
    <div className={styles.root} onClick={openClickedRow}>
      <AdminToolbar
        isFiltered={isFiltered}
        onReset={() =>
          setParams({ status: null, category: null, q: null, author: null })
        }
      >
        <AdminSearchField
          label={t('admin.feedback.columns.message')}
          placeholder={t('admin.feedback.search.message.placeholder')}
          value={q ?? ''}
          maxLength={FEEDBACK_SEARCH_MAX_LENGTH}
          onChange={(value) => setParams({ q: toSearchText(value) || null })}
        />
        <AdminSearchField
          label={t('admin.feedback.columns.from')}
          placeholder={t('admin.feedback.search.author.placeholder')}
          value={author ?? ''}
          maxLength={FEEDBACK_SEARCH_MAX_LENGTH}
          onChange={(value) =>
            setParams({ author: toSearchText(value) || null })
          }
        />
        <AdminFilterField
          label={t('admin.feedback.columns.category')}
          value={category}
          options={FEEDBACK_CATEGORIES.map((value) => ({
            value,
            label: t(`feedback.categories.${value}`),
          }))}
          onChange={(value) => setParams({ category: value ?? null })}
        />
        <AdminFilterField
          label={t('admin.feedback.columns.status')}
          value={status}
          options={FEEDBACK_STATUSES.map((value) => ({
            value,
            label: t(`admin.feedback.statuses.${value}`),
          }))}
          onChange={(value) => setParams({ status: value ?? null })}
        />
      </AdminToolbar>
      {inbox.isError ? (
        <div className={styles.error}>
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
        </div>
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
        position={
          openIndex >= 0
            ? { current: openNumber, total: totalCount }
            : undefined
        }
        onPrevious={
          openIndex > 0
            ? () => setParams({ id: items[openIndex - 1].id })
            : undefined
        }
        onNext={
          openIndex >= 0 && openIndex < items.length - 1
            ? () => setParams({ id: items[openIndex + 1].id })
            : undefined
        }
        onClose={() => setParams({ id: null })}
      />
    </div>
  )
}
