import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { Menu } from '@/components/menu/menu'
import { Text } from '@/components/text/text'
import { userProfilePath } from '@/constants/routes'
import { useSuspension } from '@/features/current-user'
import { PostLayout } from '@/features/posts'
import { ApiError } from '@/lib/api-client'
import { getAvatarUrl } from '@/lib/avatar-url'

import styles from './comments.module.scss'
import type { Comment } from './comments-api'
import { useDeleteComment } from './comments-api'

type CommentItemProps = {
  comment: Comment
  canDelete: boolean
}

// A comment is laid out exactly like a post.
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
      <PostLayout
        author={{
          name: author.displayName.trim() || author.username,
          username: author.username,
          avatarUrl: getAvatarUrl(author.avatarUrl),
        }}
        authorPath={userProfilePath(author.username)}
        publishedAt={comment.createdAt}
        headerAction={
          canDelete ? (
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
          ) : undefined
        }
      >
        <>
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
        </>
      </PostLayout>
    </li>
  )
}
