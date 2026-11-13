import { Card } from '@/components/card/card'

import type { Post as PublishedPost } from './posts-api'
import { TextTimelinePost } from './text-timeline-post'
import styles from './timeline-post-card.module.scss'

export function TimelinePostCard({ post }: { post: PublishedPost }) {
  return (
    <Card className={styles.card}>
      <TextTimelinePost post={post} />
    </Card>
  )
}
