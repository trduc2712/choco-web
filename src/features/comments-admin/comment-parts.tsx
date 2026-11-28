import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AlertDialog } from '@/components/alert-dialog/alert-dialog'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { AdminUsernameLink } from '@/features/users-admin'

import type { AdminComment } from './admin-comments-api'
import { useDeleteAdminComment } from './admin-comments-api'

export function CommentTime({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const { i18n } = useTranslation()
  const formatted = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

  return (
    <time className={className} dateTime={value}>
      {formatted}
    </time>
  )
}

// The author's username, linked to their admin page when the viewer may open
// it; a deleted account has no username.
export function CommentAuthor({
  author,
  className,
}: {
  author: AdminComment['author']
  className?: string
}) {
  const { t } = useTranslation()
  return author.username ? (
    <AdminUsernameLink
      className={className}
      userId={author.id}
      username={author.username}
    />
  ) : (
    <span className={className}>{t('admin.comments.deletedAccount')}</span>
  )
}

// Deletes a comment after a confirmation. Hidden from viewers who may not
// delete any comment, and for comments already deleted.
export function DeleteCommentButton({
  comment,
}: {
  comment: AdminComment
  size?: 'sm' | 'md'
}) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const remove = useDeleteAdminComment()
  const [isConfirming, setIsConfirming] = useState(false)

  if (comment.isDeleted || !can(PERMISSIONS.deleteAnyComment)) return null

  return (
    <>
      <button
        type="button"
        onClick={() => {
          remove.reset()
          setIsConfirming(true)
        }}
      >
        {t('admin.comments.delete')}
      </button>
      <AlertDialog
        isOpen={isConfirming}
        title={t('admin.comments.deleteTitle')}
        description={t('admin.comments.deleteDescription')}
        confirmLabel={t('admin.comments.delete')}
        isConfirming={remove.isPending}
        onCancel={() => setIsConfirming(false)}
        onConfirm={() =>
          remove.mutate(comment.id, {
            onSuccess: () => setIsConfirming(false),
          })
        }
      >
        {remove.isError ? (
          <p role="alert">{t('admin.comments.deleteFailed')}</p>
        ) : null}
      </AlertDialog>
    </>
  )
}
