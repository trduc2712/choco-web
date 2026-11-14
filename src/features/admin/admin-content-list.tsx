import { useAuth } from '@clerk/react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Input } from '@/components/input/input'
import { Select } from '@/components/select/select'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { Text } from '@/components/text/text'
import type { ApiFetch } from '@/lib/api-client'
import { useApiFetch } from '@/lib/api-client'
import { apiFieldErrors } from '@/lib/api-errors'
import { getPageCount, type OffsetPage } from '@/lib/page-response'

import styles from './admin-content-list.module.scss'
import { AdminListError } from './admin-list-error'
import { AdminPager } from './admin-pager'
import { useAdminPaging, useStepBackPastEnd } from './admin-paging'

type Kind = 'posts' | 'comments'
type Content = {
  id: string
  content: string
  author: { id: string; username: string | null }
  createdAt: string
  isDeleted: boolean
  deletedAt: string | null
  postId?: string
}

function contentQueryOptions(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  kind: Kind,
  query: string,
) {
  return queryOptions({
    queryKey: ['admin-content', viewerId, kind, query] as const,
    queryFn: ({ signal }) =>
      apiFetch<OffsetPage<Content>>(`/admin/${kind}?${query}`, { signal }),
  })
}

function localDateTime(value: string | null) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16)
}

export function AdminContentList({ kind }: { kind: Kind }) {
  const { t, i18n } = useTranslation()
  const { isSignedIn, userId } = useAuth()
  const apiFetch = useApiFetch()
  const [search, setSearch] = useSearchParams()
  const paging = useAdminPaging(`choco.admin.${kind}.pageSize`)
  const fields =
    kind === 'comments'
      ? (['q', 'authorId', 'postId', 'from', 'to'] as const)
      : (['q', 'authorId', 'from', 'to'] as const)
  const state = search.get('state') === 'deleted' ? 'deleted' : 'visible'
  const query = new URLSearchParams({
    state,
    page: String(paging.page),
    pageSize: String(paging.pageSize),
  })
  for (const field of fields) {
    const value = search.get(field)
    if (value) query.set(field, value)
  }
  const result = useQuery({
    ...contentQueryOptions(apiFetch, userId, kind, query.toString()),
    enabled: isSignedIn === true,
  })
  const items = result.data?.items ?? []
  const selected = search.get('selected')
  const totalCount = result.data?.totalCount ?? 0
  const errors = apiFieldErrors(result.error, t)
  const date = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  useStepBackPastEnd({
    isSettled: result.isSuccess && !result.isPlaceholderData,
    itemCount: items.length,
    page: paging.page,
    pageCount: getPageCount(totalCount, paging.pageSize),
  })

  function apply(formData: FormData) {
    const next = new URLSearchParams(search)
    for (const field of fields) {
      const value = String(formData.get(field) ?? '').trim()
      if (value) {
        next.set(
          field,
          field === 'from' || field === 'to'
            ? new Date(value).toISOString()
            : value,
        )
      } else next.delete(field)
    }
    next.set('state', String(formData.get('state') ?? 'visible'))
    next.delete('page')
    setSearch(next)
  }

  const columns: TableColumn<Content>[] = [
    {
      id: 'content',
      header: t('admin.content.text'),
      isRowHeader: true,
      cell: (row) => (
        <details
          className={styles.content}
          open={search.get('selected') === row.id || undefined}
        >
          <summary>
            {row.content.slice(0, 100)}
            {row.content.length > 100 ? '…' : ''}
          </summary>
          <Text className={styles.message}>{row.content}</Text>
          <Text size="sm" tone="muted">
            {row.id}
          </Text>
          {row.postId ? (
            <Text size="sm" tone="muted">
              {t('admin.content.postId')} · {row.postId}
            </Text>
          ) : null}
        </details>
      ),
    },
    {
      id: 'author',
      header: t('admin.content.author'),
      cell: ({ author }) =>
        author.username
          ? `@${author.username}`
          : t('admin.reports.all.deletedAccount'),
    },
    {
      id: 'created',
      header: t('admin.content.created'),
      cell: (row) => (
        <time dateTime={row.createdAt}>
          {date.format(new Date(row.createdAt))}
        </time>
      ),
    },
    {
      id: 'state',
      header: t('admin.users.columns.state'),
      cell: (row) => (
        <div>
          <Badge tone={row.isDeleted ? 'danger' : 'success'}>
            {t(
              row.isDeleted
                ? 'admin.users.states.deleted'
                : 'admin.content.visible',
            )}
          </Badge>
          {row.deletedAt ? (
            <Text size="sm" tone="muted">
              <time dateTime={row.deletedAt}>
                {date.format(new Date(row.deletedAt))}
              </time>
            </Text>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div className={styles.root}>
      <form
        className={styles.filters}
        onSubmit={(event) => {
          event.preventDefault()
          apply(new FormData(event.currentTarget))
        }}
        key={fields
          .map((field) => search.get(field))
          .concat(state)
          .join('|')}
      >
        <Select
          name="state"
          label={t('admin.users.columns.state')}
          defaultValue={state}
          options={[
            { value: 'visible', label: t('admin.content.visible') },
            { value: 'deleted', label: t('admin.users.states.deleted') },
          ]}
        />
        {fields.map((field) => (
          <Input
            key={field}
            name={field}
            label={t(`admin.content.${field}`)}
            type={
              field === 'from' || field === 'to' ? 'datetime-local' : 'text'
            }
            defaultValue={
              field === 'from' || field === 'to'
                ? localDateTime(search.get(field))
                : (search.get(field) ?? '')
            }
            error={errors[field]}
            maxLength={field === 'q' ? 100 : undefined}
          />
        ))}
        <Button type="submit" variant="secondary">
          {t('admin.content.apply')}
        </Button>
      </form>
      {selected &&
      result.isSuccess &&
      !items.some((item) => item.id === selected) ? (
        <Text role="status" tone="muted" size="sm">
          {t('admin.content.targetNotOnPage', { id: selected })}
        </Text>
      ) : null}
      {result.isError ? (
        <AdminListError
          error={result.error}
          onRetry={() => void result.refetch()}
        />
      ) : (
        <Table
          caption={t(`admin.screens.${kind}`)}
          isCaptionHidden
          columns={columns}
          rows={items}
          getRowId={(item) => item.id}
          isLoading={result.isPending}
          emptyState={
            <EmptyState
              size="sm"
              icon="file-warning"
              title={t('admin.content.empty')}
            />
          }
        />
      )}
      {totalCount > 0 && items.length > 0 ? (
        <AdminPager
          page={paging.page}
          pageSize={paging.pageSize}
          totalCount={totalCount}
          itemCount={items.length}
          onPageChange={paging.setPage}
          onPageSizeChange={paging.setPageSize}
        />
      ) : null}
    </div>
  )
}
