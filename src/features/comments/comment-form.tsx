import { useUser } from '@clerk/react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { Text } from '@/components/text/text'
import { useMyAvatarUrl, useSuspension } from '@/features/current-user'
import { ApiError } from '@/lib/api-client'
import { apiFieldErrors } from '@/lib/api-errors'
import { isBlockedError } from '@/lib/block-error'

import styles from './comments.module.scss'
import { COMMENT_MAX_LENGTH, isNotFound, useAddComment } from './comments-api'

type CommentFormProps = {
  postId: string
  onPostGone: () => void
}

// The counter only appears once the comment is getting close to the limit.
const COUNT_VISIBLE_FROM = COMMENT_MAX_LENGTH * 0.8

export function CommentForm({ postId, onPostGone }: CommentFormProps) {
  const { t } = useTranslation()
  const { user } = useUser()
  const messageId = useId()
  const avatarUrl = useMyAvatarUrl()
  const name =
    user?.fullName?.trim() || user?.username || t('postComposer.author')
  const [value, setValue] = useState('')
  const [fieldError, setFieldError] = useState<string>()
  const [failure, setFailure] = useState<'blocked' | 'failed'>()
  const addComment = useAddComment(postId)
  const { isSuspended } = useSuspension()
  // Match the API: trimmed, UTF-16 length.
  const length = value.trim().length
  const isOverLimit = length > COMMENT_MAX_LENGTH
  const canSubmit =
    length > 0 && !isOverLimit && !addComment.isPending && !isSuspended
  const message = isOverLimit
    ? t('comments.tooLong', { limit: COMMENT_MAX_LENGTH })
    : fieldError

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
      <Avatar name={name} src={avatarUrl} />
      <div className={styles.formContent}>
        <div className={styles.box}>
          <textarea
            className={styles.input}
            aria-label={t('comments.label')}
            aria-invalid={message ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            placeholder={t('comments.placeholder')}
            rows={1}
            value={value}
            readOnly={addComment.isPending || isSuspended}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends, Shift+Enter starts a new line.
              if (
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault()
                submit()
              }
            }}
          />
          <Button
            type="submit"
            icon="send"
            size="md"
            variant="ghost"
            className={styles.send}
            aria-label={t('comments.submit')}
            disabled={!canSubmit}
            isLoading={addComment.isPending}
          />
        </div>
        {message || length >= COUNT_VISIBLE_FROM ? (
          <div className={styles.formMeta}>
            <Text
              as="span"
              id={messageId}
              size="xs"
              tone="danger"
              role={message ? 'alert' : undefined}
            >
              {message}
            </Text>
            {length >= COUNT_VISIBLE_FROM ? (
              <Text as="span" size="xs" tone={isOverLimit ? 'danger' : 'muted'}>
                {t('comments.count', {
                  count: length,
                  limit: COMMENT_MAX_LENGTH,
                })}
              </Text>
            ) : null}
          </div>
        ) : null}
        {failure ? (
          <Alert tone="danger" role="alert">
            {t(
              failure === 'blocked'
                ? 'blocks.actionBlocked'
                : 'comments.submitError',
            )}
          </Alert>
        ) : null}
      </div>
    </form>
  )
}
