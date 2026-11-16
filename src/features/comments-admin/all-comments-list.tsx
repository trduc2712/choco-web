import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import { Text } from '@/components/text/text'
import {
  AdminListError,
  AdminPager,
  useStepBackPastEnd,
} from '@/features/admin'
import { getPageCount } from '@/lib/page-response'

import type { AdminComment } from './admin-comments-api'
import { useAdminComments } from './admin-comments-api'
import styles from './all-comments-list.module.scss'
import {
  CommentAuthor,
  CommentTime,
  DeleteCommentButton,
} from './comment-parts'
import type { AdminCommentsState } from './use-admin-comments-state'

// Every comment that matches the filters, newest first, one per row. Opening a
// comment's thread switches to the Posts tab with its post chosen.
export function AllCommentsList({ state }: { state: AdminCommentsState }) {
  const { t } = useTranslation()
  const comments = useAdminComments({
    ...state.filters,
    postId: state.postId,
    authorId: state.authorId,
    page: state.page,
    pageSize: state.pageSize,
  })
  const items = comments.data?.items ?? []
  const totalCount = comments.data?.totalCount ?? 0
  useStepBackPastEnd({
    isSettled: comments.data !== undefined && !comments.isPlaceholderData,
    itemCount: items.length,
    page: state.page,
    pageCount: getPageCount(totalCount, state.pageSize),
  })

  const columns: TableColumn<AdminComment>[] = [
    {
      id: 'comment',
      header: t('admin.comments.columns.comment'),
      isRowHeader: true,
      cell: (row) => (
        <span className={styles.comment}>
          <Text as="span" size="sm" className={styles.excerpt}>
            {row.content}
          </Text>
          {row.isDeleted ? (
            <Badge tone="danger">{t('admin.comments.states.deleted')}</Badge>
          ) : null}
        </span>
      ),
    },
    {
      id: 'author',
      header: t('admin.comments.columns.author'),
      cell: (row) => <CommentAuthor author={row.author} />,
    },
    {
      id: 'created',
      header: t('admin.comments.columns.created'),
      cell: (row) => <CommentTime value={row.createdAt} />,
    },
    {
      id: 'actions',
      header: t('admin.comments.columns.actions'),
      cell: (row) => (
        <span className={styles.actions}>
          <Button
            size="sm"
            variant="ghost"
            iconStart="messages"
            onClick={() =>
              state.update({
                view: 'posts',
                post: row.postId,
                postId: null,
                authorId: null,
              })
            }
          >
            {t('admin.comments.viewThread')}
          </Button>
          <DeleteCommentButton comment={row} />
        </span>
      ),
    },
  ]

  const scope = state.postId ? 'post' : state.authorId ? 'author' : null

  return (
    <>
      {scope ? (
        <div className={styles.scope} role="status">
          <Text size="sm" tone="muted">
            {t(`admin.comments.scope.${scope}`)}
          </Text>
          <Button
            size="sm"
            variant="link"
            onClick={() => state.update({ postId: null, authorId: null })}
          >
            {t('admin.comments.scope.clear')}
          </Button>
        </div>
      ) : null}
      {comments.isError ? (
        <AdminListError
          error={comments.error}
          onRetry={() => void comments.refetch()}
        />
      ) : (
        <Table
          caption={t('admin.comments.views.all')}
          isCaptionHidden
          columns={columns}
          rows={items}
          getRowId={(row) => row.id}
          isLoading={comments.isPending}
          emptyState={
            <EmptyState
              size="sm"
              icon="messages"
              title={t('admin.comments.empty')}
              description={t(
                state.isFiltered
                  ? 'admin.comments.emptyFiltered'
                  : 'admin.comments.emptyHint',
              )}
            />
          }
        />
      )}
      {totalCount > 0 && items.length > 0 ? (
        <AdminPager
          page={state.page}
          pageSize={state.pageSize}
          totalCount={totalCount}
          itemCount={items.length}
          onPageChange={state.setPage}
          onPageSizeChange={state.setPageSize}
        />
      ) : null}
    </>
  )
}
