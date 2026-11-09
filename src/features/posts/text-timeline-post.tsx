import { userProfilePath } from '@/constants/routes'
import { getAvatarUrl } from '@/lib/avatar-url'

import { Post } from './post'
import { PostActions } from './post-actions'
import type { Post as PublishedPost } from './posts-api'

export function TextTimelinePost({ post }: { post: PublishedPost }) {
  const { author } = post

  return (
    <Post
      author={{
        name: author.displayName.trim() || author.username,
        username: author.username,
        avatarUrl: getAvatarUrl(author.avatarUrl),
      }}
      authorPath={userProfilePath(author.username)}
      publishedAt={post.createdAt}
      isEdited={post.modifiedAt !== post.createdAt}
      footer={<PostActions post={post} />}
    >
      {post.content}
    </Post>
  )
}
