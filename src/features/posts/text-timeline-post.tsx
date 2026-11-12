import { useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Menu } from '@/components/menu/menu'
import { userPostPath, userProfilePath } from '@/constants/routes'
import { useSuspension } from '@/features/current-user'
import { ReportDialog } from '@/features/reports'
import { getAvatarUrl } from '@/lib/avatar-url'

import { Post } from './post'
import { PostActions } from './post-actions'
import type { Post as PublishedPost } from './posts-api'

type TextTimelinePostProps = {
  post: PublishedPost
  // True on the post's own page; the comment action then has nowhere to go.
  isDetail?: boolean
}

// A "more" menu with Report on someone else's post. It stays hidden on the
// viewer's own post (the API refuses it) and until the viewer is known. The
// Clerk username tells whose post it is, so no request is added.
function PostMenu({ post }: { post: PublishedPost }) {
  const { t } = useTranslation()
  const { user: me } = useUser()
  const { isSuspended } = useSuspension()
  const [isReporting, setIsReporting] = useState(false)

  if (!me?.username || me.username === post.author.username) return null

  return (
    <>
      <Menu
        label={t('posts.moreActions')}
        isLabelHidden
        icon="more-horizontal"
        variant="ghost"
        size="sm"
        align="end"
        items={[
          {
            id: 'report',
            label: t('reports.menu.reportPost'),
            icon: 'flag',
            tone: 'danger',
            isDisabled: isSuspended,
            onSelect: () => setIsReporting(true),
          },
        ]}
      />
      {isReporting ? (
        <ReportDialog
          target={{ type: 'Post', id: post.id }}
          onClose={() => setIsReporting(false)}
        />
      ) : null}
    </>
  )
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
      headerAction={<PostMenu post={post} />}
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
