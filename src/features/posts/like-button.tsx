import { useTranslation } from 'react-i18next'

import { useSuspension } from '@/features/current-user'

import { formatCount } from './format-count'
import type { Post } from './posts-api'
import { useLikePost } from './use-like-post'

export function LikeButton({ post }: { post: Post }) {
  const { t, i18n } = useTranslation()
  const { setLiked } = useLikePost(post.id)
  const { isSuspended } = useSuspension()
  const { count, label } = formatCount(i18n.resolvedLanguage, post.likeCount)

  return (
    <button
      type="button"
      aria-pressed={post.isLikedByMe}
      disabled={isSuspended}
      onClick={() => setLiked(!post.isLikedByMe)}
      aria-label={t('posts.like', { likes: label })}
    >
      <span aria-hidden="true">&hearts; </span>
      {count}
    </button>
  )
}
