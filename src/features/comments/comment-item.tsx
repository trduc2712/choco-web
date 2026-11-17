import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Button } from '@/components/button/button'
import { Menu } from '@/components/menu/menu'
import { Text } from '@/components/text/text'
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
import styles from './comments.module.scss'
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
      <li
        {...anchor}
        className={styles.thread}
        data-thread={hasThreadLine ? '' : undefined}
      >
        <div className={styles.item}>
          <span className={styles.ghostAvatar} aria-hidden="true" />
          <div className={styles.itemMain}>
            <Text tone="muted" className={styles.ghostBubble}>
              {t('comments.unavailable')}
            </Text>
          </div>
        </div>
        {replies}
      </li>
    )
  }

  const name = author.displayName.trim() || author.username
  const profilePath = userProfilePath(author.username)
  const canReply = depth < COMMENT_MAX_DEPTH && !isSuspended

  function reactionButton(
    reaction: Reaction,
    icon: 'thumbs-up' | 'thumbs-down',
  ) {
    const isOn = comment.myReaction === reaction
    const count =
      (reaction === 'like' ? comment.likeCount : comment.dislikeCount) ?? 0
    const shared = {
      size: 'sm',
      variant: 'ghost',
      className: cx(styles.reaction, isOn && styles.reactionOn),
      'aria-label': t(`comments.${reaction}`),
      'aria-pressed': isOn,
      disabled: isSuspended,
      onClick: () => react(reaction),
    } as const
    // With a count the button holds both, so one hover area covers them.
    return count > 0 ? (
      <Button {...shared} iconStart={icon}>
        {count}
      </Button>
    ) : (
      <Button {...shared} icon={icon} />
    )
  }

  return (
    <li
      {...anchor}
      className={styles.thread}
      data-thread={hasThreadLine ? '' : undefined}
    >
      <div className={styles.item} data-depth={depth > 0 ? 'reply' : undefined}>
        <AuthorAvatar
          name={name}
          src={getAvatarUrl(author.avatarUrl)}
          to={profilePath}
          size={depth > 0 ? 'sm' : 'md'}
        />
        <div className={styles.itemMain}>
          <div className={styles.bubbleRow}>
            <div className={styles.bubble}>
              <AuthorName name={name} to={profilePath} />
              <Text className={styles.text} dir="auto">
                {comment.content}
              </Text>
            </div>
            {canDelete ? (
              <div className={styles.itemMenu}>
                <Menu
                  label={t('comments.actions')}
                  isLabelHidden
                  icon="more-horizontal"
                  variant="ghost"
                  size="sm"
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
          <div className={styles.itemActions}>
            {reactionButton('like', 'thumbs-up')}
            {reactionButton('dislike', 'thumbs-down')}
            {canReply ? (
              <Button
                size="sm"
                variant="ghost"
                className={styles.replyAction}
                aria-expanded={isReplying}
                onClick={() => setIsReplying((open) => !open)}
              >
                {t('comments.reply')}
              </Button>
            ) : null}
            <Text as="span" size="xs" tone="muted">
              <PostTime publishedAt={comment.createdAt} />
            </Text>
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
            <Alert tone="danger" role="alert">
              {t(
                error === 'forbidden'
                  ? 'comments.deleteForbidden'
                  : 'comments.deleteError',
              )}
            </Alert>
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
    <div className={styles.replies} data-flat={depth >= 3 ? '' : undefined}>
      {isOpen ? null : (
        <Button
          size="sm"
          variant="link"
          iconStart="corner-down-right"
          onClick={onToggle}
        >
          {t('comments.viewReplies', { count: comment.replyCount })}
        </Button>
      )}
      {isOpen && replies.isPending ? (
        <CommentSkeletons count={1} nested />
      ) : null}
      {isOpen && items.length > 0 ? (
        <ul className={styles.replyList}>
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
        <Alert tone="danger" role="alert">
          {t('comments.repliesLoadError')}
        </Alert>
      ) : null}
      {isOpen && (replies.hasNextPage || replies.isError) ? (
        <Button
          size="sm"
          variant="link"
          disabled={replies.isFetching}
          isLoading={replies.isFetching}
          onClick={() =>
            hasFailedFirstPage
              ? void replies.refetch()
              : void replies.fetchNextPage()
          }
        >
          {t(hasFailedFirstPage ? 'common.retry' : 'comments.loadMoreReplies')}
        </Button>
      ) : null}
    </div>
  )
}
