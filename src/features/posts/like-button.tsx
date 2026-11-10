import { useTranslation } from 'react-i18next'

import { ToggleButton } from '@/components/toggle-button/toggle-button'
import { cx } from '@/lib/cx'

import { formatCount } from './format-count'
import styles from './post-actions.module.scss'
import type { Post } from './posts-api'
import { useLikePost } from './use-like-post'

export function LikeButton({ post }: { post: Post }) {
  const { t, i18n } = useTranslation()
  const { setLiked } = useLikePost(post.id)
  const { count, label } = formatCount(i18n.resolvedLanguage, post.likeCount)

  return (
    <ToggleButton
      size="sm"
      icon="heart"
      className={cx(styles.action, styles.like)}
      isPressed={post.isLikedByMe}
      onPressedChange={setLiked}
      aria-label={t('posts.like', { likes: label })}
    >
      {count}
    </ToggleButton>
  )
}
