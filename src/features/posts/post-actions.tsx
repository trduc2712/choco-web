import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import type { IconName } from '@/components/icon/icon-paths'
import { useToast } from '@/components/toast/use-toast'
import { cx } from '@/lib/cx'

import { LikeButton } from './like-button'
import styles from './post-actions.module.scss'
import type { Post } from './posts-api'

// Actions the API doesn't support yet: they show a count of 0 and, when
// pressed, say the feature isn't available.
function UnavailableAction({
  icon,
  label,
  className,
}: {
  icon: IconName
  label: string
  className: string
}) {
  const { t } = useTranslation()
  const { showToast } = useToast()

  return (
    <Button
      variant="secondary"
      size="sm"
      iconStart={icon}
      aria-label={label}
      className={cx(styles.action, className)}
      onClick={() => showToast({ title: t('posts.unavailable'), tone: 'info' })}
    >
      0
    </Button>
  )
}

export function PostActions({ post }: { post: Post }) {
  const { t } = useTranslation()

  return (
    <>
      <LikeButton post={post} />
      <UnavailableAction
        icon="message"
        label={t('posts.comment', { comments: 0 })}
        className={styles.comment}
      />
      <UnavailableAction
        icon="send"
        label={t('posts.share', { shares: 0 })}
        className={styles.share}
      />
    </>
  )
}
