import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Alert } from '@/components/alert/alert'
import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import { Textarea } from '@/components/textarea/textarea'

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
  className?: string
}

export function PostComposer({
  authorName,
  avatarUrl,
  onPost,
  className,
}: PostComposerProps) {
  const { t } = useTranslation()
  const submitting = useRef(false)
  const [hasPublishError, setHasPublishError] = useState(false)
  const { control, formState, handleSubmit, register, reset } = useForm({
    defaultValues: { body: '' },
    mode: 'onChange',
    resolver: zodResolver(postSchema),
  })
  const body = useWatch({ control, name: 'body' })
  const characterCount = body.trim().length
  const isOverLimit = characterCount > POST_MAX_LENGTH
  const { isSubmitting, isValid } = formState
  const submitPost = handleSubmit(async ({ body }) => {
    setHasPublishError(false)
    try {
      await onPost(body)
    } catch {
      setHasPublishError(true)
      return
    }
    reset()
  })

  return (
    <Card className={className}>
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
        <Avatar name={authorName} src={avatarUrl} size="lg" shape="square" />
        <Stack gap={3} className={styles.content}>
          <Textarea
            {...register('body')}
            label={t('postComposer.body')}
            isLabelHidden
            readOnly={isSubmitting}
            placeholder={t('postComposer.placeholder')}
            error={
              isOverLimit
                ? t('postComposer.tooLong', { limit: POST_MAX_LENGTH })
                : undefined
            }
            rows={3}
            className={styles.field}
          />
          {hasPublishError ? (
            <Alert tone="danger" role="alert">
              {t('postComposer.publishError')}
            </Alert>
          ) : null}
          <Stack
            direction="row"
            align="center"
            justify="end"
            gap={3}
            isWrapping
            className={styles.footer}
          >
            <Text as="span" size="sm" tone={isOverLimit ? 'danger' : 'muted'}>
              {t('postComposer.count', {
                count: characterCount,
                limit: POST_MAX_LENGTH,
              })}
            </Text>
            <Button
              type="submit"
              iconStart="send"
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
            >
              {t('postComposer.post')}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Card>
  )
}
