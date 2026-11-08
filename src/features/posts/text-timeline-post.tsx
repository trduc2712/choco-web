import { getAvatarUrl } from '@/lib/avatar-url'

import { Post } from './post'
import type { Post as PublishedPost } from './posts-api'

const postCounts = { replies: 0, reposts: 0, likes: 0 }

export function TextTimelinePost({ post }: { post: PublishedPost }) {
  const { author } = post

  return (
    <Post
      author={{
        name: author.displayName.trim() || author.username,
        username: author.username,
        avatarUrl: getAvatarUrl(author.avatarUrl),
      }}
      publishedAt={post.createdAt}
      isEdited={post.modifiedAt !== post.createdAt}
      counts={postCounts}
    >
      {post.content}
    </Post>
  )
}
