import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import { userProfilePath } from '@/constants/routes'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import styles from './comments.module.scss'
import type { Comment } from './comments-api'
import { useDeleteComment } from './comments-api'

type CommentItemProps = {
  comment: Comment
  canDelete: boolean
}

export function CommentItem({ comment, canDelete }: CommentItemProps) {
  const { t, i18n } = useTranslation()
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<'forbidden' | 'failed' | null>(null)
  const deleteComment = useDeleteComment(comment.postId)
  const { author } = comment
  const name = author.displayName.trim() || author.username
  const dateLabel = new Date(comment.createdAt).toLocaleDateString(
    i18n.resolvedLanguage,
    { month: 'short', day: 'numeric', timeZone: 'UTC' },
  )

  function confirmDelete() {
    deleteComment.mutate(comment.id, {
      onError: (e) =>
        setError(
          e instanceof ApiError && e.status === 403 ? 'forbidden' : 'failed',
        ),
      onSettled: () => setIsConfirming(false),
    })
  }

  return (
    <li className={styles.comment}>
      <Avatar name={name} src={getAvatarUrl(author.avatarUrl)} shape="square" />
      <div className={styles.commentBody}>
        <Text as="div" size="sm">
          <Link to={userProfilePath(author.username)} variant="subtle">
            <bdi>{name}</bdi>
          </Link>
          <Text as="span" size="sm" tone="muted">
            {' '}
            · @{author.username} ·{' '}
            <time dateTime={comment.createdAt}>{dateLabel}</time>
          </Text>
        </Text>
        <Text className={styles.text}>{comment.content}</Text>
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
      {canDelete ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            icon="trash"
            aria-label={t('comments.delete')}
            onClick={() => {
              setError(null)
              setIsConfirming(true)
            }}
          />
          <AlertDialog
            isOpen={isConfirming}
            title={t('comments.deleteTitle')}
            description={t('comments.deleteDescription')}
            confirmLabel={t('comments.delete')}
            isConfirming={deleteComment.isPending}
            onConfirm={confirmDelete}
            onCancel={() => setIsConfirming(false)}
          />
        </>
      ) : null}
    </li>
  )
}
