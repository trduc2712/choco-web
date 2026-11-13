import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useId, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Alert } from '@/components/alert/alert'
import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { Dialog } from '@/components/dialog/dialog'
import { Text } from '@/components/text/text'

import styles from './post-composer.module.scss'

const POST_MAX_LENGTH = 500

const postSchema = z.object({
  body: z
    .string()
    .trim()
    // Match the API's UTF-16 length check.
    .refine((body) => body.length > 0 && body.length <= POST_MAX_LENGTH),
})

type PostComposerProps = {
  authorName: string
  avatarUrl?: string
  onPost: (body: string) => void | Promise<unknown>
  // A suspended viewer reads the timeline but cannot post.
  isReadOnly?: boolean
  className?: string
}

// A prompt card that opens the writing dialog, the way Facebook does. Closing
// the dialog keeps the draft, so the prompt shows it until the post goes out.
export function PostComposer({
  authorName,
  avatarUrl,
  onPost,
  isReadOnly = false,
  className,
}: PostComposerProps) {
  const { t } = useTranslation()
  const errorId = useId()
  const submitting = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hasPublishError, setHasPublishError] = useState(false)
  const { control, formState, handleSubmit, register, reset } = useForm({
    defaultValues: { body: '' },
    mode: 'onChange',
    resolver: zodResolver(postSchema),
  })
  const body = useWatch({ control, name: 'body' })
  const draft = body.trim()
  const characterCount = draft.length
  const isOverLimit = characterCount > POST_MAX_LENGTH
  const { isSubmitting, isValid } = formState
  const { ref: registerRef, ...bodyField } = register('body')
  const submitPost = handleSubmit(async ({ body }) => {
    setHasPublishError(false)
    try {
      await onPost(body)
    } catch {
      setHasPublishError(true)
      return
    }
    reset()
    setIsOpen(false)
  })

  // The dialog focuses its close button first; the writing belongs in the text.
  useEffect(() => {
    if (isOpen) textareaRef.current?.focus()
  }, [isOpen])

  return (
    <>
      <Card className={className}>
        <div className={styles.prompt}>
          <Avatar name={authorName} src={avatarUrl} size="md" />
          <button
            type="button"
            className={styles.promptButton}
            data-draft={draft ? '' : undefined}
            disabled={isReadOnly}
            aria-haspopup="dialog"
            onClick={() => setIsOpen(true)}
          >
            {draft || t('postComposer.placeholder')}
          </button>
        </div>
      </Card>
      <Dialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('postComposer.createTitle')}
      >
        <form
          className={styles.form}
          onSubmit={async (event) => {
            event.preventDefault()
            if (submitting.current) return

            submitting.current = true
            try {
              await submitPost(event)
            } finally {
              submitting.current = false
            }
          }}
        >
          <div className={styles.author}>
            <Avatar name={authorName} src={avatarUrl} size="md" />
            <Text as="span" weight="semibold">
              {authorName}
            </Text>
          </div>
          <textarea
            {...bodyField}
            ref={(element) => {
              registerRef(element)
              textareaRef.current = element
            }}
            className={styles.input}
            aria-label={t('postComposer.body')}
            aria-invalid={isOverLimit || undefined}
            aria-describedby={isOverLimit ? errorId : undefined}
            readOnly={isSubmitting || isReadOnly}
            placeholder={t('postComposer.placeholder')}
            rows={1}
          />
          {hasPublishError ? (
            <Alert tone="danger" role="alert">
              {t('postComposer.publishError')}
            </Alert>
          ) : null}
          <div className={styles.meta}>
            <Text
              as="span"
              id={errorId}
              size="sm"
              tone="danger"
              role={isOverLimit ? 'alert' : undefined}
            >
              {isOverLimit
                ? t('postComposer.tooLong', { limit: POST_MAX_LENGTH })
                : null}
            </Text>
            <Text as="span" size="sm" tone={isOverLimit ? 'danger' : 'muted'}>
              {t('postComposer.count', {
                count: characterCount,
                limit: POST_MAX_LENGTH,
              })}
            </Text>
          </div>
          <Button
            type="submit"
            isFullWidth
            disabled={!isValid || isSubmitting || isReadOnly}
            isLoading={isSubmitting}
          >
            {t('postComposer.post')}
          </Button>
        </form>
      </Dialog>
    </>
  )
}
