import { useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { ScrollArea } from '@/components/scroll-area/scroll-area'
import { Tabs } from '@/components/tabs/tabs'
import { Text } from '@/components/text/text'
import { useCurrentUser } from '@/features/current-user'
import { PostComposer } from '@/features/post-composer'
import type { PostAuthor } from '@/features/posts'
import { SamplePostList, TimelinePost } from '@/features/posts'

import styles from './home-page.module.scss'

type LocalPost = {
  id: number
  author: PostAuthor
  clerkUserId?: string
  body: string
  publishedAt: string
}

export function HomePage() {
  const { t } = useTranslation()
  const { user } = useUser()
  const currentUser = useCurrentUser()
  const [localPosts, setLocalPosts] = useState<LocalPost[]>([])
  const author = {
    name: user?.fullName?.trim() || user?.username || t('postComposer.author'),
    username: user?.username ?? undefined,
    avatarUrl: user?.hasImage ? user.imageUrl : undefined,
    accountId: currentUser.data?.id,
  }

  function addLocalPost(body: string) {
    const publishedAt = new Date().toISOString()
    setLocalPosts((posts) => [
      { id: posts.length, author, clerkUserId: user?.id, body, publishedAt },
      ...posts,
    ])
  }

  const timeline = (
    <ScrollArea
      className={styles.timeline}
      label={t('home.timelineContent')}
      maxHeight="var(--home-scroll-height)"
    >
      <PostComposer
        authorName={author.name}
        accountId={author.accountId}
        isAccountIdLoading={currentUser.isLoading}
        avatarUrl={author.avatarUrl}
        className={styles.composer}
        onPost={addLocalPost}
      />
      {localPosts.map(({ id, author, clerkUserId, body, publishedAt }) => {
        const isViewer = Boolean(clerkUserId && clerkUserId === user?.id)
        const accountId =
          author.accountId ?? (isViewer ? currentUser.data?.id : undefined)
        return (
          <TimelinePost
            key={id}
            author={{ ...author, accountId }}
            isAccountIdLoading={isViewer && !accountId && currentUser.isLoading}
            publishedAt={publishedAt}
            counts={{ replies: 0, reposts: 0, likes: 0 }}
          >
            <Text className={styles.postBody}>{body}</Text>
          </TimelinePost>
        )
      })}
      <SamplePostList />
    </ScrollArea>
  )

  return (
    <>
      <Heading level={1} className={styles.heading}>
        {t('home.timeline')}
      </Heading>
      <Tabs
        className={styles.tabs}
        label={t('home.timeline')}
        items={[
          { id: 'feed', label: t('home.feed'), content: timeline },
          { id: 'following', label: t('home.following'), content: timeline },
        ]}
      />
    </>
  )
}
