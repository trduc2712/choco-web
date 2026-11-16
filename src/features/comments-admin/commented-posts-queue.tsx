import { useId, useLayoutEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
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
import styles from './commented-posts-queue.module.scss'
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
        <EmptyState
          size="sm"
          role="status"
          icon="messages"
          title={t('admin.comments.posts.unavailable')}
          action={
            <Button
              variant="secondary"
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
            </Button>
          }
        />
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
      <div
        className={styles.workspace}
        role="status"
        aria-label={t('admin.comments.loading')}
      >
        <div className={styles.inbox}>
          <div className={styles.inboxHead}>
            <Skeleton width="50%" />
          </div>
          {[0, 1, 2, 3].map((index) => (
            <div className={styles.skeletonRow} key={index}>
              <Skeleton
                shape="rect"
                width="var(--size-avatar-sm)"
                height="var(--size-avatar-sm)"
              />
              <Skeleton lines={3} />
            </div>
          ))}
        </div>
        <div className={styles.loadingDetails}>
          <div className={styles.caseHeader}>
            <Skeleton lines={3} width="65%" />
          </div>
          <div className={styles.section}>
            <Skeleton lines={8} />
          </div>
        </div>
      </div>
    )
  }

  if (items.length === 0 && !state.selectedPostId) {
    return (
      <EmptyState
        size="sm"
        role="status"
        icon="messages"
        title={t('admin.comments.empty')}
        description={t(
          state.isFiltered
            ? 'admin.comments.emptyFiltered'
            : 'admin.comments.emptyHint',
        )}
      />
    )
  }

  return (
    <>
      <div className={styles.workspace} aria-busy={posts.isFetching}>
        <section
          className={styles.inbox}
          aria-label={t('admin.comments.posts.title')}
          hidden={isMobileDetail}
        >
          <header className={styles.inboxHead}>
            <Heading ref={inboxHeading} tabIndex={-1} level={2} size="md">
              {t('admin.comments.posts.title')}
            </Heading>
            <Badge
              count={totalCount}
              max={Number.MAX_SAFE_INTEGER}
              tone="primary"
            />
          </header>
          <ul className={styles.targetList} role="list">
            {items.map((row) => (
              <li key={row.postId}>
                <button
                  type="button"
                  className={styles.row}
                  ref={row === selected ? activeRow : undefined}
                  aria-pressed={row === selected && (!narrow || isMobileDetail)}
                  aria-controls={detailId}
                  onClick={() => {
                    state.update({ post: row.postId }, { keepPage: true })
                    setShowDetails(true)
                  }}
                >
                  <span className={styles.rowIcon}>
                    <Icon size="sm" name="messages" />
                  </span>
                  <span className={styles.rowText}>
                    <span className={styles.rowMeta}>
                      {row.recentCommentCount > 0 ? (
                        <Badge tone="primary" variant="outline">
                          {t('admin.comments.posts.recent', {
                            count: row.recentCommentCount,
                          })}
                        </Badge>
                      ) : null}
                      {row.post.isDeleted ? (
                        <Badge tone="danger">
                          {t('admin.comments.posts.postDeleted')}
                        </Badge>
                      ) : null}
                      <CommentTime value={row.lastCommentedAt} />
                    </span>
                    <strong className={styles.rowTitle}>
                      {excerpt(row.post.content) ||
                        t('admin.comments.posts.untitled')}
                    </strong>
                    <span className={styles.rowMeta}>
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
          className={styles.detail}
          aria-label={t('admin.comments.thread.title')}
          hidden={narrow && !isMobileDetail}
        >
          {narrow ? (
            <Button
              ref={back}
              className={styles.back}
              variant="secondary"
              iconStart="arrow-left"
              onClick={() => {
                restoreFocus.current = true
                setShowDetails(false)
              }}
            >
              {t('admin.comments.back')}
            </Button>
          ) : null}
          {selected ? (
            <>
              <header className={styles.caseHeader}>
                <div>
                  <div className={styles.tags}>
                    <Badge tone="neutral" variant="outline">
                      {t('admin.comments.posts.post')}
                    </Badge>
                    <Badge tone="neutral" variant="outline">
                      {t('admin.comments.posts.commentCount', {
                        count: selected.commentCount,
                      })}
                    </Badge>
                    {selected.post.isDeleted ? (
                      <Badge tone="danger">
                        {t('admin.comments.posts.postDeleted')}
                      </Badge>
                    ) : null}
                  </div>
                  <Heading level={2} size="xl" className={styles.caseTitle}>
                    {selected.post.content.trim() ||
                      t('admin.comments.posts.untitled')}
                  </Heading>
                  <Text size="sm" tone="muted">
                    <PostByline row={selected} />
                    {' · '}
                    {t('admin.comments.posts.participants', {
                      count: selected.participantCount,
                    })}
                  </Text>
                </div>
                {selected.post.author.username && !selected.post.isDeleted ? (
                  <Link
                    to={userPostPath(
                      selected.post.author.username,
                      selected.postId,
                    )}
                  >
                    {t('admin.comments.thread.openPost')}
                  </Link>
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
            <div
              className={styles.section}
              role="status"
              aria-label={t('admin.comments.loading')}
            >
              <Skeleton lines={6} />
            </div>
          ) : (
            <Text
              className={styles.section}
              size="sm"
              tone="muted"
              role="status"
            >
              {t('admin.comments.thread.postUnavailable')}
            </Text>
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
