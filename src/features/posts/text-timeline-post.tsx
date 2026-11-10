import { useNavigate } from 'react-router'

import { userPostPath, userProfilePath } from '@/constants/routes'
import { getAvatarUrl } from '@/lib/avatar-url'

import { Post } from './post'
import { PostActions } from './post-actions'
import type { Post as PublishedPost } from './posts-api'

type TextTimelinePostProps = {
  post: PublishedPost
  // True on the post's own page; the comment action then has nowhere to go.
  isDetail?: boolean
}

export function TextTimelinePost({ post, isDetail }: TextTimelinePostProps) {
  const { author } = post
  const navigate = useNavigate()

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
      footer={
        <PostActions
          post={post}
          comments={{
            isOpen: isDetail === true,
            onOpen: () => {
              if (!isDetail)
                void navigate(userPostPath(author.username, post.id))
            },
          }}
        />
      }
    >
      {post.content}
    </Post>
  )
}
