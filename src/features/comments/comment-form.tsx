import { useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import { Textarea } from '@/components/textarea/textarea'
import { ApiError } from '@/lib/api-client'
import { apiFieldErrors } from '@/lib/api-errors'
import { isBlockedError } from '@/lib/block-error'

import styles from './comments.module.scss'
import { COMMENT_MAX_LENGTH, isNotFound, useAddComment } from './comments-api'

type CommentFormProps = {
  postId: string
  onPostGone: () => void
}

export function CommentForm({ postId, onPostGone }: CommentFormProps) {
  const { t } = useTranslation()
  const { user } = useUser()
  const name =
    user?.fullName?.trim() || user?.username || t('postComposer.author')
  const [value, setValue] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [failure, setFailure] = useState<'blocked' | 'failed'>()
  const addComment = useAddComment(postId)
  // Match the API: trimmed, UTF-16 length.
  const length = value.trim().length
  const isOverLimit = length > COMMENT_MAX_LENGTH
  const canSubmit = length > 0 && !isOverLimit && !addComment.isPending

  function submit() {
    if (!canSubmit) return
    setFieldError(undefined)
    setFailure(undefined)
    addComment.mutate(value.trim(), {
      onSuccess: () => setValue(''),
      onError: (error) => {
        if (isNotFound(error)) {
          onPostGone()
        } else if (error instanceof ApiError && error.status === 400) {
          setFieldError(
            apiFieldErrors(error, t).content ?? t('comments.invalid'),
          )
        } else {
          setFailure(isBlockedError(error) ? 'blocked' : 'failed')
        }
      },
    })
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <Avatar
        name={name}
        src={user?.hasImage ? user.imageUrl : undefined}
        shape="square"
      />
      <Stack gap={3} className={styles.formContent}>
        <Textarea
          label={t('comments.label')}
          isLabelHidden
          placeholder={t('comments.placeholder')}
          rows={1}
          className={styles.field}
          value={value}
          readOnly={addComment.isPending}
          onChange={(event) => setValue(event.target.value)}
          error={
            isOverLimit
              ? t('comments.tooLong', { limit: COMMENT_MAX_LENGTH })
              : fieldError
          }
        />
        {failure ? (
          <Alert tone="danger" role="alert">
            {t(
              failure === 'blocked'
                ? 'blocks.actionBlocked'
                : 'comments.submitError',
            )}
          </Alert>
        ) : null}
        <Stack direction="row" align="center" justify="end" gap={3} isWrapping>
          <Text as="span" size="sm" tone={isOverLimit ? 'danger' : 'muted'}>
            {t('comments.count', { count: length, limit: COMMENT_MAX_LENGTH })}
          </Text>
          <Button
            type="submit"
            iconStart="send"
            disabled={!canSubmit}
            isLoading={addComment.isPending}
          >
            {t('comments.submit')}
          </Button>
        </Stack>
      </Stack>
    </form>
  )
}
