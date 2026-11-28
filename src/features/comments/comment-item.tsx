import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Menu } from '@/components/menu/menu'
import { userProfilePath } from '@/constants/routes'
import {
  PERMISSIONS,
  useCurrentUser,
  usePermissions,
  useSuspension,
} from '@/features/current-user'
import { AuthorAvatar, AuthorName, PostTime } from '@/features/posts'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'
import { cx } from '@/lib/cx'

import { CommentForm } from './comment-form'
import { CommentSkeletons } from './comment-skeletons'
import type { Comment, Reaction } from './comments-api'
import {
  COMMENT_MAX_DEPTH,
  useDeleteComment,
  useReactToComment,
  useReplies,
} from './comments-api'

type CommentItemProps = {
  comment: Comment
  // 0 for a top-level comment, one more for each level of replies.
  depth?: number
  onPostGone: () => void
  commentPath?: string[]
}

// The avatar and name are laid out like a post's. The text starts on the line
// where a post shows its time, which sits beside the name here.
export function CommentItem({
  comment,
  depth = 0,
  onPostGone,
  commentPath,
}: CommentItemProps) {
  const { t } = useTranslation()
  const { isSuspended } = useSuspension()
  const me = useCurrentUser()
  const { can } = usePermissions()
  const mayDelete =
    comment.authorId !== null &&
    (me.data?.id === comment.authorId || can(PERMISSIONS.deleteAnyComment))
  const canDelete = mayDelete && !isSuspended
  const [areRepliesOpen, setAreRepliesOpen] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<'forbidden' | 'failed' | null>(null)
  const deleteComment = useDeleteComment(comment.postId)
  const react = useReactToComment(comment)
  const { author } = comment
  const isOnCommentPath = commentPath?.[depth] === comment.id
  const isTarget = isOnCommentPath && commentPath.length === depth + 1
  const showReplies = areRepliesOpen || (isOnCommentPath && !isTarget)
  const targetRef = useRef<HTMLLIElement>(null)
  const anchor = {
    ref: isTarget ? targetRef : undefined,
    tabIndex: isTarget ? -1 : undefined,
  }
  useEffect(() => {
    if (!isTarget) return
    const frame = requestAnimationFrame(() => {
      targetRef.current?.focus({ preventScroll: true })
      targetRef.current?.scrollIntoView?.({ block: 'nearest' })
    })
    return () => cancelAnimationFrame(frame)
  }, [isTarget])

  function confirmDelete() {
    deleteComment.mutate(comment, {
      onError: (e) =>
        setError(
          e instanceof ApiError && e.status === 403 ? 'forbidden' : 'failed',
        ),
      onSettled: () => setIsConfirming(false),
    })
  }

  // A line runs from this comment's avatar down to its replies once they show,
  // up to the level where the thread stops stepping in.
  const hasThreadLine = showReplies && comment.replyCount > 0 && depth < 3
  const replies = (
    <CommentReplies
      comment={comment}
      depth={depth}
      isOpen={showReplies}
      onToggle={() => setAreRepliesOpen((open) => !open)}
      onPostGone={onPostGone}
      commentPath={isOnCommentPath ? commentPath : undefined}
    />
  )

  // A comment the viewer can't see still holds its place in the thread, so
  // its replies stay reachable.
  if (comment.isDeleted || !author) {
    return (
      <li {...anchor} data-thread={hasThreadLine ? '' : undefined}>
        <div>
          <span aria-hidden="true" />
          <div>
            <p>{t('comments.unavailable')}</p>
          </div>
        </div>
        {replies}
      </li>
    )
  }

  const name = author.displayName.trim() || author.username
  const profilePath = userProfilePath(author.username)
  const canReply = depth < COMMENT_MAX_DEPTH && !isSuspended

  function reactionButton(reaction: Reaction) {
    const isOn = comment.myReaction === reaction
    const count =
      (reaction === 'like' ? comment.likeCount : comment.dislikeCount) ?? 0
    const shared = {
      className: cx('comments-reaction', isOn && 'comments-reactionOn'),
      'aria-label': t(`comments.${reaction}`),
      'aria-pressed': isOn,
      disabled: isSuspended,
      onClick: () => react(reaction),
    } as const
    // With a count the button holds both, so one hover area covers them.
    return (
      <button type="button" {...shared}>
        {shared['aria-label']} {count > 0 ? count : null}
      </button>
    )
  }

  return (
    <li {...anchor} data-thread={hasThreadLine ? '' : undefined}>
      <div data-depth={depth > 0 ? 'reply' : undefined}>
        <AuthorAvatar
          name={name}
          src={getAvatarUrl(author.avatarUrl)}
          to={profilePath}
        />
        <div>
          <div>
            <div>
              <AuthorName name={name} to={profilePath} />
              <p dir="auto">{comment.content}</p>
            </div>
            {canDelete ? (
              <div>
                <Menu
                  label={t('comments.actions')}
                  isLabelHidden
                  icon="more-horizontal"
                  align="end"
                  items={[
                    {
                      id: 'delete',
                      label: t('comments.delete'),
                      icon: 'trash',
                      tone: 'danger',
                      onSelect: () => {
                        setError(null)
                        setIsConfirming(true)
                      },
                    },
                  ]}
                />
              </div>
            ) : null}
          </div>
          {canDelete ? (
            <AlertDialog
              isOpen={isConfirming}
              title={t('comments.deleteTitle')}
              description={t('comments.deleteDescription')}
              confirmLabel={t('comments.delete')}
              isConfirming={deleteComment.isPending}
              onConfirm={confirmDelete}
              onCancel={() => setIsConfirming(false)}
            />
          ) : null}
          <div>
            {reactionButton('like')}
            {reactionButton('dislike')}
            {canReply ? (
              <button
                type="button"
                aria-expanded={isReplying}
                onClick={() => setIsReplying((open) => !open)}
              >
                {t('comments.reply')}
              </button>
            ) : null}
            <span>
              <PostTime publishedAt={comment.createdAt} />
            </span>
          </div>
          {isReplying ? (
            <CommentForm
              postId={comment.postId}
              parentId={comment.id}
              replyToName={name}
              onPostGone={onPostGone}
              onCancel={() => setIsReplying(false)}
              onSent={() => {
                setIsReplying(false)
                setAreRepliesOpen(true)
              }}
            />
          ) : null}
          {error ? (
            <div role="alert">
              {t(
                error === 'forbidden'
                  ? 'comments.deleteForbidden'
                  : 'comments.deleteError',
              )}
            </div>
          ) : null}
        </div>
      </div>
      {replies}
    </li>
  )
}

type CommentRepliesProps = {
  comment: Comment
  depth: number
  isOpen: boolean
  onToggle: () => void
  onPostGone: () => void
  commentPath?: string[]
}

// The replies of one comment, loaded one level at a time when asked for.
function CommentReplies({
  comment,
  depth,
  isOpen,
  onToggle,
  onPostGone,
  commentPath,
}: CommentRepliesProps) {
  const { t } = useTranslation()
  const replies = useReplies(comment.postId, comment.id, isOpen)
  if (comment.replyCount === 0 && !isOpen) return null

  // A reply appended locally can show up again in a later page.
  const seen = new Set<string>()
  const items = (
    replies.data?.pages.flatMap((page) => page.items) ?? []
  ).filter((reply) => !seen.has(reply.id) && seen.add(reply.id))
  const hasFailedFirstPage = replies.isError && !replies.data

  return (
    <div data-flat={depth >= 3 ? '' : undefined}>
      {isOpen ? null : (
        <button type="button" onClick={onToggle}>
          {t('comments.viewReplies', { count: comment.replyCount })}
        </button>
      )}
      {isOpen && replies.isPending ? <CommentSkeletons /> : null}
      {isOpen && items.length > 0 ? (
        <ul>
          {items.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              onPostGone={onPostGone}
              commentPath={commentPath}
            />
          ))}
        </ul>
      ) : null}
      {isOpen && replies.isError ? (
        <div role="alert">{t('comments.repliesLoadError')}</div>
      ) : null}
      {isOpen && (replies.hasNextPage || replies.isError) ? (
        <button
          type="button"
          aria-busy={replies.isFetching || undefined}
          disabled={replies.isFetching || replies.isFetching}
          onClick={() =>
            hasFailedFirstPage
              ? void replies.refetch()
              : void replies.fetchNextPage()
          }
        >
          {t(hasFailedFirstPage ? 'common.retry' : 'comments.loadMoreReplies')}
        </button>
      ) : null}
    </div>
  )
}
