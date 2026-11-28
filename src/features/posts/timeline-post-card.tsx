import type { Post as PublishedPost } from './posts-api'
import { TextTimelinePost } from './text-timeline-post'

export function TimelinePostCard({ post }: { post: PublishedPost }) {
  return (
    <div>
      <TextTimelinePost post={post} showTopComment />
    </div>
  )
}
