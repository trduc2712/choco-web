import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import type { IconName } from '@/components/icon/icon-paths'
import { useToast } from '@/components/toast/use-toast'
import { ToggleButton } from '@/components/toggle-button/toggle-button'
import { cx } from '@/lib/cx'

import { formatCount } from './format-count'
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
      variant="ghost"
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

type PostActionsProps = {
  post: Post
  // When set, the comment action opens the post's comments. `isOpen` marks the
  // page that already shows them. Without it the action is a placeholder.
  comments?: { isOpen: boolean; onOpen: () => void }
}

export function PostActions({ post, comments }: PostActionsProps) {
  const { t, i18n } = useTranslation()
  const { count, label } = formatCount(
    i18n.resolvedLanguage,
    post.commentCount ?? 0,
  )

  return (
    <>
      <LikeButton post={post} />
      {comments ? (
        <ToggleButton
          size="sm"
          icon="message"
          className={cx(styles.action, styles.comment)}
          isPressed={comments.isOpen}
          onPressedChange={() => comments.onOpen()}
          aria-label={t('posts.comment', { comments: label })}
        >
          {count}
        </ToggleButton>
      ) : (
        <UnavailableAction
          icon="message"
          label={t('posts.comment', { comments: 0 })}
          className={styles.comment}
        />
      )}
      <UnavailableAction
        icon="send"
        label={t('posts.share', { shares: 0 })}
        className={styles.share}
      />
    </>
  )
}
