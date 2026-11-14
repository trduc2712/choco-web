import { useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Menu } from '@/components/menu/menu'
import { userPostPath, userProfilePath } from '@/constants/routes'
import {
  PERMISSIONS,
  usePermissions,
  useSuspension,
} from '@/features/current-user'
import { ReportDialog } from '@/features/reports'
import { getAvatarUrl } from '@/lib/avatar-url'

import { Post } from './post'
import { PostActions } from './post-actions'
import { PostManagementDialog } from './post-management-dialog'
import type { Post as PublishedPost } from './posts-api'

type TextTimelinePostProps = {
  post: PublishedPost
  // True on the post's own page; the comment action then has nowhere to go.
  isDetail?: boolean
}

function PostMenu({ post }: { post: PublishedPost }) {
  const { t } = useTranslation()
  const { user: me } = useUser()
  const { isSuspended } = useSuspension()
  const { can } = usePermissions()
  const [manage, setManage] = useState<'edit' | 'delete' | null>(null)
  const [isReporting, setIsReporting] = useState(false)

  if (!me?.username) return null
  const isOwner = me.username === post.author.username

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
          ...(isOwner
            ? [
                {
                  id: 'edit',
                  label: t('posts.editPost'),
                  icon: 'pencil' as const,
                  isDisabled: isSuspended,
                  onSelect: () => setManage('edit'),
                },
              ]
            : [
                {
                  id: 'report',
                  label: t('reports.menu.reportPost'),
                  icon: 'flag' as const,
                  tone: 'danger' as const,
                  isDisabled: isSuspended,
                  onSelect: () => setIsReporting(true),
                },
              ]),
          ...(isOwner || can(PERMISSIONS.deleteAnyPost)
            ? [
                {
                  id: 'delete',
                  label: t('posts.deletePost'),
                  icon: 'trash' as const,
                  tone: 'danger' as const,
                  isDisabled: isSuspended,
                  onSelect: () => setManage('delete'),
                },
              ]
            : []),
        ]}
      />
      {isReporting ? (
        <ReportDialog
          target={{ type: 'Post', id: post.id }}
          onClose={() => setIsReporting(false)}
        />
      ) : null}
      {manage ? (
        <PostManagementDialog
          post={post}
          action={manage}
          onClose={() => setManage(null)}
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
