import type { PostAuthor } from './post'
import { Post } from './post'
import type { Post as PublishedPost } from './posts-api'

const postCounts = { replies: 0, reposts: 0, likes: 0 }

export function TextTimelinePost({
  post,
  author,
}: {
  post: PublishedPost
  author: PostAuthor
}) {
  return (
    <Post author={author} publishedAt={post.createdAt} counts={postCounts}>
      {post.content}
    </Post>
  )
}
