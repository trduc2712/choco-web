import { useTranslation } from 'react-i18next'

import { Card } from '@/components/card/card'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import postStyles from './post.module.scss'
import styles from './post-card-skeletons.module.scss'
import cardStyles from './timeline-post-card.module.scss'

// Enough placeholders to run past the bottom of a tall screen, so a loading
// post list never stops short of it.
export const FEED_SKELETON_COUNT = 8

// Stands in for a list of TimelinePostCard while the first page loads. It
// reuses the post's own layout classes and text sizes, so each placeholder is
// as tall as a one-line post and nothing shifts when the posts arrive.
export function PostCardSkeletons({ count = 2 }: { count?: number }) {
  const { t } = useTranslation()
  return (
    <Stack role="status">
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      {Array.from({ length: count }, (_, index) => (
        <Card key={index} className={cardStyles.card} aria-hidden="true">
          <PostSkeleton />
        </Card>
      ))}
    </Stack>
  )
}

// One post's shape without its card, for places that show a bare post, like
// the post dialog. It only draws; the caller announces the loading.
export function PostSkeleton({ className }: { className?: string }) {
  return (
    <div className={cx(postStyles.post, className)} aria-hidden="true">
      <div className={postStyles.byline}>
        <Skeleton
          shape="circle"
          width="var(--size-avatar-md)"
          height="var(--size-avatar-md)"
        />
        <div className={postStyles.identity}>
          <Text as="div" className={styles.line}>
            <Skeleton width="var(--space-9)" />
          </Text>
          <Text as="div" size="xs" className={styles.line}>
            <Skeleton width="var(--space-8)" />
          </Text>
        </div>
      </div>
      <div className={postStyles.body}>
        <Text as="div" className={styles.line}>
          <Skeleton width="var(--size-measure-sm)" />
        </Text>
      </div>
      <div className={postStyles.footer}>
        {[0, 1, 2].map((action) => (
          <div key={action} className={styles.action}>
            <Skeleton width="var(--space-7)" />
          </div>
        ))}
      </div>
    </div>
  )
}
