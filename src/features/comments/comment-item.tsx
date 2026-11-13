import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Menu } from '@/components/menu/menu'
import { Text } from '@/components/text/text'
import { userProfilePath } from '@/constants/routes'
import { useSuspension } from '@/features/current-user'
import { AuthorAvatar, AuthorName, PostTime } from '@/features/posts'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import styles from './comments.module.scss'
import type { Comment } from './comments-api'
import { useDeleteComment } from './comments-api'

type CommentItemProps = {
  comment: Comment
  canDelete: boolean
}

// The avatar and name are laid out like a post's. The text starts on the line
// where a post shows its time, which sits beside the name here.
export function CommentItem({
  comment,
  canDelete: mayDelete,
}: CommentItemProps) {
  const { t } = useTranslation()
  const { isSuspended } = useSuspension()
  const canDelete = mayDelete && !isSuspended
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<'forbidden' | 'failed' | null>(null)
  const deleteComment = useDeleteComment(comment.postId)
  const { author } = comment
  const name = author.displayName.trim() || author.username
  const profilePath = userProfilePath(author.username)

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
    <li className={styles.item}>
      <AuthorAvatar
        name={name}
        src={getAvatarUrl(author.avatarUrl)}
        to={profilePath}
      />
      <div className={styles.itemMain}>
        <div className={styles.itemHead}>
          <AuthorName name={name} to={profilePath} />
          <Text as="span" size="xs" tone="muted">
            <span aria-hidden="true">· </span>
            <PostTime publishedAt={comment.createdAt} />
          </Text>
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
        <Text className={styles.text} dir="auto">
          {comment.content}
        </Text>
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
    </li>
  )
}
