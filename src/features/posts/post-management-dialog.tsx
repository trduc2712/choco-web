import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { Textarea } from '@/components/textarea/textarea'
import { useApiFetch } from '@/lib/api-client'
import { apiFieldErrors } from '@/lib/api-errors'

import { removePost, replacePost } from './post-cache'
import type { Post } from './posts-api'

export function PostManagementDialog({
  post,
  action,
  onClose,
}: {
  post: Post
  action: 'edit' | 'delete'
  onClose: () => void
}) {
  const { t } = useTranslation()
  const apiFetch = useApiFetch()
  const client = useQueryClient()
  const [draft, setDraft] = useState(post.content)
  const isDeleting = action === 'delete'
  const mutation = useMutation({
    mutationFn: async () => {
      const path = `/posts/${encodeURIComponent(post.id)}`
      if (isDeleting) {
        await apiFetch<void>(path, { method: 'DELETE' })
        return
      }
      return apiFetch<Post>(path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft.trim() }),
      })
    },
    onSuccess: async (updated) => {
      if (updated) replacePost(client, updated)
      else {
        removePost(client, post.id)
        await client.invalidateQueries({
          queryKey: ['post'],
          predicate: (query) => query.queryKey[2] === post.id,
        })
      }
      onClose()
    },
  })
  const errors = apiFieldErrors(mutation.error, t)
  const title = t(isDeleting ? 'posts.deletePost' : 'posts.editPost')

  return (
    <Dialog
      isOpen
      onClose={() => {
        if (!mutation.isPending) onClose()
      }}
      title={title}
      footer={
        <Button
          variant={isDeleting ? 'danger' : 'primary'}
          isLoading={mutation.isPending}
          disabled={
            !isDeleting &&
            (!draft.trim() ||
              draft.trim().length > 500 ||
              draft.trim() === post.content)
          }
          onClick={() => mutation.mutate()}
        >
          {title}
        </Button>
      }
    >
      {isDeleting ? (
        t('posts.deleteConfirm')
      ) : (
        <Textarea
          label={t('postComposer.body')}
          value={draft}
          rows={5}
          readOnly={mutation.isPending}
          error={errors.content}
          onChange={(event) => {
            setDraft(event.target.value)
            mutation.reset()
          }}
        />
      )}
      {mutation.isError && !errors.content ? (
        <Alert tone="danger" role="alert">
          {t('posts.manageError')}
        </Alert>
      ) : null}
    </Dialog>
  )
}
