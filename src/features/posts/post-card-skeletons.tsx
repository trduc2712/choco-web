import { useTranslation } from 'react-i18next'

import { Card } from '@/components/card/card'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

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
        <Card key={index} aria-hidden="true">
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
    <div className={cx('post-post', className)} aria-hidden="true">
      <div>
        <Skeleton
          shape="circle"
          width="var(--size-avatar-md)"
          height="var(--size-avatar-md)"
        />
        <div>
          <Text as="div">
            <Skeleton width="var(--space-9)" />
          </Text>
          <Text as="div" size="xs">
            <Skeleton width="var(--space-8)" />
          </Text>
        </div>
      </div>
      <div>
        <Text as="div">
          <Skeleton width="var(--size-measure-sm)" />
        </Text>
      </div>
      <div>
        {[0, 1, 2].map((action) => (
          <div key={action}>
            <Skeleton width="var(--space-7)" />
          </div>
        ))}
      </div>
    </div>
  )
}
