import { Card } from '@/components/card/card'

import type { Post as PublishedPost } from './posts-api'
import { TextTimelinePost } from './text-timeline-post'

export function TimelinePostCard({ post }: { post: PublishedPost }) {
  return (
    <Card>
      <TextTimelinePost post={post} showTopComment />
    </Card>
  )
}
