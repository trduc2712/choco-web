import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Button } from '@/components/button/button'
import { Card } from '@/components/card/card'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import { Textarea } from '@/components/textarea/textarea'
import { AccountAvatar } from '@/features/account-avatar'

import styles from './post-composer.module.scss'

const POST_MAX_LENGTH = 280

const postSchema = z.object({
  body: z
    .string()
    .refine(
      (body) => body.trim().length > 0 && [...body].length <= POST_MAX_LENGTH,
    ),
})

type PostComposerProps = {
  authorName: string
  accountId?: string
  isAccountIdLoading?: boolean
  avatarUrl?: string
  onPost: (body: string) => void
  className?: string
}

export function PostComposer({
  authorName,
  accountId,
  isAccountIdLoading,
  avatarUrl,
  onPost,
  className,
}: PostComposerProps) {
  const { t } = useTranslation()
  const { control, formState, handleSubmit, register, reset } = useForm({
    defaultValues: { body: '' },
    mode: 'onChange',
    resolver: zodResolver(postSchema),
  })
  const body = useWatch({ control, name: 'body' })
  const characterCount = [...body].length
  const isOverLimit = characterCount > POST_MAX_LENGTH

  return (
    <Card className={className}>
      <form
        className={styles.form}
        onSubmit={handleSubmit(({ body }) => {
          onPost(body)
          reset()
        })}
      >
        <AccountAvatar
          accountId={accountId}
          isAccountIdLoading={isAccountIdLoading}
          name={authorName}
          src={avatarUrl}
          size="lg"
          shape="square"
        />
        <Stack gap={3} className={styles.content}>
          <Textarea
            {...register('body')}
            label={t('postComposer.body')}
            isLabelHidden
            placeholder={t('postComposer.placeholder')}
            error={
              isOverLimit
                ? t('postComposer.tooLong', { limit: POST_MAX_LENGTH })
                : undefined
            }
            rows={3}
            className={styles.field}
          />
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
              disabled={!formState.isValid}
            >
              {t('postComposer.post')}
            </Button>
          </Stack>
        </Stack>
      </form>
    </Card>
  )
}
