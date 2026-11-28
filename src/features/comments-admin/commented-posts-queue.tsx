import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { userPostPath } from '@/constants/routes'
import {
  AdminListError,
  AdminPager,
  useStepBackPastEnd,
} from '@/features/admin'
import { AdminUsernameLink } from '@/features/users-admin'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ApiError } from '@/lib/api-client'
import { getPageCount } from '@/lib/page-response'

import type { CommentedPost } from './admin-comments-api'
import { useCommentedPosts } from './admin-comments-api'
import { CommentTime } from './comment-parts'
import { CommentThread } from './comment-thread'
import type { AdminCommentsState } from './use-admin-comments-state'

// The longest stretch of a post shown in a row.
const EXCERPT_LENGTH = 140

function excerpt(content: string) {
  const text = content.trim()
  return text.length > EXCERPT_LENGTH
    ? `${text.slice(0, EXCERPT_LENGTH).trimEnd()}…`
    : text
}

function PostByline({ row }: { row: CommentedPost }) {
  const { t } = useTranslation()
  const { author } = row.post
  return author.username ? (
    <Trans
      i18nKey="admin.comments.posts.by"
      components={{
        account: (
          <AdminUsernameLink userId={author.id} username={author.username} />
        ),
      }}
    />
  ) : (
    t('admin.comments.posts.byDeleted')
  )
}

// Posts with comments on the left, the chosen post's thread on the right, the
// way the report queue lays out its targets. The most recently commented post
// comes first. On a narrow screen the thread replaces the list and a button
// leads back.
export function CommentedPostsQueue({ state }: { state: AdminCommentsState }) {
  const { t } = useTranslation()
  const params = {
    ...state.filters,
    page: state.page,
    pageSize: state.pageSize,
  }
  const posts = useCommentedPosts(params)
  const items = posts.data?.items ?? []
  const totalCount = posts.data?.totalCount ?? 0
  useStepBackPastEnd({
    isSettled: posts.data !== undefined && !posts.isPlaceholderData,
    itemCount: items.length,
    page: state.page,
    pageCount: getPageCount(totalCount, state.pageSize),
  })

  const [showDetails, setShowDetails] = useState(Boolean(state.selectedPostId))
  const narrow = useMediaQuery('(width < 768px)')
  const chosen = items.find((row) => row.postId === state.selectedPostId)
  const needsLookup = Boolean(
    state.selectedPostId &&
    !chosen &&
    posts.isSuccess &&
    !posts.isPlaceholderData,
  )
  const lookup = useCommentedPosts(
    { ...state.filters, postId: state.selectedPostId, page: 1, pageSize: 1 },
    needsLookup,
  )
  const selected = state.selectedPostId
    ? (chosen ??
      lookup.data?.items.find((row) => row.postId === state.selectedPostId))
    : items[0]
  const isMobileDetail = narrow && showDetails && Boolean(state.selectedPostId)
  const detailId = useId()
  const back = useRef<HTMLButtonElement>(null)
  const activeRow = useRef<HTMLButtonElement>(null)
  const inboxHeading = useRef<HTMLHeadingElement>(null)
  const restoreFocus = useRef(false)

  useLayoutEffect(() => {
    if (isMobileDetail && !posts.isPending && !posts.isError)
      back.current?.focus()
    if (!showDetails && restoreFocus.current) {
      restoreFocus.current = false
      const focusTarget = activeRow.current ?? inboxHeading.current
      focusTarget?.focus()
    }
  }, [isMobileDetail, showDetails, posts.isPending, posts.isError])

  if (posts.isError) {
    if (posts.error instanceof ApiError && posts.error.status === 404) {
      return (
        <section role="status">
          <h2>{t('admin.comments.posts.unavailable')}</h2>
          {
            <button
              type="button"
              onClick={() =>
                state.update({
                  view: 'all',
                  post: null,
                  postId: state.selectedPostId ?? null,
                  authorId: null,
                })
              }
            >
              {t('admin.comments.views.all')}
            </button>
          }
        </section>
      )
    }

    return (
      <AdminListError
        error={posts.error}
        onRetry={() => void posts.refetch()}
      />
    )
  }

  if (posts.isPending) {
    return (
      <div role="status" aria-label={t('admin.comments.loading')}>
        <div>
          <div>
            <span aria-hidden="true">&hellip;</span>
          </div>
          {[0, 1, 2, 3].map((index) => (
            <div key={index}>
              <span aria-hidden="true">&hellip;</span>
              <span aria-hidden="true">&hellip;</span>
            </div>
          ))}
        </div>
        <div>
          <div>
            <span aria-hidden="true">&hellip;</span>
          </div>
          <div>
            <span aria-hidden="true">&hellip;</span>
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !state.selectedPostId) {
    return (
      <section role="status">
        <h2>{t('admin.comments.empty')}</h2>
        <p>
          {t(
            state.isFiltered
              ? 'admin.comments.emptyFiltered'
              : 'admin.comments.emptyHint',
          )}
        </p>
      </section>
    )
  }

  return (
    <>
      <div aria-busy={posts.isFetching}>
        <section
          aria-label={t('admin.comments.posts.title')}
          hidden={isMobileDetail}
        >
          <header>
            <h2 ref={inboxHeading} tabIndex={-1}>
              {t('admin.comments.posts.title')}
            </h2>
            <span>{totalCount}</span>
          </header>
          <ul role="list">
            {items.map((row) => (
              <li key={row.postId}>
                <button
                  type="button"
                  ref={row === selected ? activeRow : undefined}
                  aria-pressed={row === selected && (!narrow || isMobileDetail)}
                  aria-controls={detailId}
                  onClick={() => {
                    state.update({ post: row.postId }, { keepPage: true })
                    setShowDetails(true)
                  }}
                >
                  <span>
                    <span aria-hidden="true">💬</span>
                  </span>
                  <span>
                    <span>
                      {row.recentCommentCount > 0 ? (
                        <span>
                          {t('admin.comments.posts.recent', {
                            count: row.recentCommentCount,
                          })}
                        </span>
                      ) : null}
                      {row.post.isDeleted ? (
                        <span>{t('admin.comments.posts.postDeleted')}</span>
                      ) : null}
                      <CommentTime value={row.lastCommentedAt} />
                    </span>
                    <strong>
                      {excerpt(row.post.content) ||
                        t('admin.comments.posts.untitled')}
                    </strong>
                    <span>
                      {t('admin.comments.posts.commentCount', {
                        count: row.commentCount,
                      })}
                      {' · '}
                      {t('admin.comments.posts.participants', {
                        count: row.participantCount,
                      })}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section
          id={detailId}
          aria-label={t('admin.comments.thread.title')}
          hidden={narrow && !isMobileDetail}
        >
          {narrow ? (
            <button
              type="button"
              ref={back}
              onClick={() => {
                restoreFocus.current = true
                setShowDetails(false)
              }}
            >
              {t('admin.comments.back')}
            </button>
          ) : null}
          {selected ? (
            <>
              <header>
                <div>
                  <div>
                    <span>{t('admin.comments.posts.post')}</span>
                    <span>
                      {t('admin.comments.posts.commentCount', {
                        count: selected.commentCount,
                      })}
                    </span>
                    {selected.post.isDeleted ? (
                      <span>{t('admin.comments.posts.postDeleted')}</span>
                    ) : null}
                  </div>
                  <h2>
                    {selected.post.content.trim() ||
                      t('admin.comments.posts.untitled')}
                  </h2>
                  <p>
                    <PostByline row={selected} />
                    {' · '}
                    {t('admin.comments.posts.participants', {
                      count: selected.participantCount,
                    })}
                  </p>
                </div>
                {selected.post.author.username && !selected.post.isDeleted ? (
                  <RouterLink
                    to={userPostPath(
                      selected.post.author.username,
                      selected.postId,
                    )}
                  >
                    {t('admin.comments.thread.openPost')}
                  </RouterLink>
                ) : null}
              </header>
              {!narrow || isMobileDetail ? (
                <CommentThread
                  key={selected.postId}
                  postId={selected.postId}
                  filters={state.filters}
                  total={selected.commentCount}
                  onViewAll={() =>
                    state.update({
                      view: 'all',
                      postId: selected.postId,
                      post: null,
                    })
                  }
                  onFilterAuthor={(authorId) =>
                    state.update({ view: 'all', authorId, post: null })
                  }
                />
              ) : null}
            </>
          ) : needsLookup && lookup.isError ? (
            <AdminListError
              error={lookup.error}
              onRetry={() => void lookup.refetch()}
            />
          ) : !needsLookup || lookup.isPending ? (
            <div role="status" aria-label={t('admin.comments.loading')}>
              <span aria-hidden="true">&hellip;</span>
            </div>
          ) : (
            <p role="status">{t('admin.comments.thread.postUnavailable')}</p>
          )}
        </section>
      </div>
      {totalCount > 0 && items.length > 0 && !isMobileDetail ? (
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
