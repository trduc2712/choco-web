import { useUser } from '@clerk/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { ScrollArea } from '@/components/scroll-area/scroll-area'
import { Tabs } from '@/components/tabs/tabs'
import {
  FollowingFeed,
  RecommendedFeed,
  useMyFollowingCount,
} from '@/features/feed'
import { PostComposer } from '@/features/post-composer'
import type { Post, PostAuthor } from '@/features/posts'
import {
  SamplePostList,
  TextTimelinePost,
  usePublishPost,
} from '@/features/posts'

import styles from './home-page.module.scss'

export function HomePage() {
  const { t } = useTranslation()
  const { user } = useUser()
  const author = {
    name: user?.fullName?.trim() || user?.username || t('postComposer.author'),
    username: user?.username ?? undefined,
    avatarUrl: user?.hasImage ? user.imageUrl : undefined,
  }

  return <HomeTimeline key={user?.id} author={author} />
}

function HomeTimeline({ author }: { author: PostAuthor }) {
  const { t } = useTranslation()
  const [publishedPosts, setPublishedPosts] = useState<Post[]>([])
  const [selectedTab, setSelectedTab] = useState<string>()
  const followingCount = useMyFollowingCount(true)
  // Until the viewer picks a tab, people who follow no one start on the
  // recommendations.
  const tab =
    selectedTab ?? (followingCount.data === 0 ? 'recommended' : 'feed')
  const { mutateAsync: publishPost } = usePublishPost()

  async function handlePublish(body: string) {
    const post = await publishPost(body)
    setPublishedPosts((posts) => [post, ...posts])
  }

  const timeline = (
    <ScrollArea
      className={styles.timeline}
      label={t('home.timelineContent')}
      maxHeight="var(--home-scroll-height)"
    >
      <PostComposer
        authorName={author.name}
        avatarUrl={author.avatarUrl}
        className={styles.composer}
        onPost={handlePublish}
      />
      {publishedPosts.map((post) => (
        <TextTimelinePost key={post.id} post={post} />
      ))}
      <SamplePostList />
    </ScrollArea>
  )

  const followingTimeline = (
    <ScrollArea
      className={styles.timeline}
      label={t('home.timelineContent')}
      maxHeight="var(--home-scroll-height)"
    >
      <FollowingFeed />
    </ScrollArea>
  )

  const recommendedTimeline = (
    <ScrollArea
      className={styles.timeline}
      label={t('home.timelineContent')}
      maxHeight="var(--home-scroll-height)"
    >
      <RecommendedFeed />
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
        value={tab}
        onChange={setSelectedTab}
        items={[
          { id: 'feed', label: t('home.feed'), content: timeline },
          {
            id: 'following',
            label: t('home.following'),
            content: followingTimeline,
          },
          {
            id: 'recommended',
            label: t('home.recommended'),
            content: recommendedTimeline,
          },
        ]}
      />
    </>
  )
}
