import { Text } from '@/components/text/text'

import type { Post } from './my-posts'
import type { PostAuthor } from './timeline-post'
import { TimelinePost } from './timeline-post'
import styles from './timeline-post.module.scss'

const postCounts = { replies: 0, reposts: 0, likes: 0 }

export function TextTimelinePost({
  post,
  author,
}: {
  post: Post
  author: PostAuthor
}) {
  return (
    <TimelinePost
      author={author}
      publishedAt={post.createdAt}
      counts={postCounts}
    >
      <Text className={styles.postText}>{post.content}</Text>
    </TimelinePost>
  )
}
