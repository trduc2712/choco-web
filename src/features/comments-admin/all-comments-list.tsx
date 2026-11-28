import { useTranslation } from 'react-i18next'

import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import {
  AdminListError,
  AdminPager,
  useStepBackPastEnd,
} from '@/features/admin'
import { getPageCount } from '@/lib/page-response'

import type { AdminComment } from './admin-comments-api'
import { useAdminComments } from './admin-comments-api'
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
        <span>
          <span>{row.content}</span>
          {row.isDeleted ? (
            <span>{t('admin.comments.states.deleted')}</span>
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
        <span>
          <button
            type="button"
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
          </button>
          <DeleteCommentButton comment={row} />
        </span>
      ),
    },
  ]

  const scope = state.postId ? 'post' : state.authorId ? 'author' : null

  return (
    <>
      {scope ? (
        <div role="status">
          <p>{t(`admin.comments.scope.${scope}`)}</p>
          <button
            type="button"
            onClick={() => state.update({ postId: null, authorId: null })}
          >
            {t('admin.comments.scope.clear')}
          </button>
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
            <section>
              <h2>{t('admin.comments.empty')}</h2>
              <p>
                {t(
                  state.isFiltered
                    ? 'admin.comments.emptyFiltered'
                    : 'admin.comments.emptyHint',
                )}
              </p>
            </section>
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
