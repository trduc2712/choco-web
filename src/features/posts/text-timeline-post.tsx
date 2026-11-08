import type { PostAuthor } from './post'
import { Post } from './post'
import type { Post as PublishedPost } from './posts-api'

const postCounts = { replies: 0, reposts: 0, likes: 0 }

export function TextTimelinePost({
  post,
  author,
  isAuthorLoading,
}: {
  post: PublishedPost
  author: PostAuthor
  isAuthorLoading?: boolean
}) {
  return (
    <Post
      author={author}
      publishedAt={post.createdAt}
      isEdited={
        post.modifiedAt !== undefined && post.modifiedAt !== post.createdAt
      }
      isAuthorLoading={isAuthorLoading}
      counts={postCounts}
    >
      {post.content}
    </Post>
  )
}
