import { useTranslation } from 'react-i18next'

import { useToast } from '@/components/toast/use-toast'

import { formatCount } from './format-count'
import { LikeButton } from './like-button'
import type { Post } from './posts-api'

// Actions the API doesn't support yet: they show a count of 0 and, when
// pressed, say the feature isn't available.
function UnavailableAction({ label }: { label: string }) {
  const { t } = useTranslation()
  const { showToast } = useToast()

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => showToast({ title: t('posts.unavailable'), tone: 'info' })}
    >
      {label}
    </button>
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
        <button
          type="button"
          aria-pressed={comments.isOpen}
          onClick={comments.onOpen}
          aria-label={t('posts.comment', { comments: label })}
        >
          {t('posts.comment', { comments: count })}
        </button>
      ) : (
        <UnavailableAction label={t('posts.comment', { comments: 0 })} />
      )}
      <UnavailableAction label={t('posts.share', { shares: 0 })} />
    </>
  )
}
