import { useUser } from '@clerk/react'
import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { useSuspension } from '@/features/current-user'
import { FollowingFeed, RecommendedFeed, useFeedTab } from '@/features/feed'
import { PostComposer } from '@/features/post-composer'
import type { PostAuthor } from '@/features/posts'
import {
  TimelinePostCard,
  usePublishedPosts,
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

// The Feed and Following tabs live in the app header and set the tab in the URL.
function HomeTimeline({ author }: { author: PostAuthor }) {
  const { t } = useTranslation()
  const publishedPosts = usePublishedPosts()
  const { tab } = useFeedTab()
  const { mutateAsync: publishPost } = usePublishPost()
  const { isSuspended } = useSuspension()

  async function handlePublish(body: string) {
    await publishPost(body)
  }

  return (
    <div className={styles.timeline}>
      <Heading level={1} className={styles.heading}>
        {t('home.timeline')}
      </Heading>
      {tab === 'feed' ? (
        <>
          <PostComposer
            authorName={author.name}
            avatarUrl={author.avatarUrl}
            onPost={handlePublish}
            isReadOnly={isSuspended}
          />
          {publishedPosts.map((post) => (
            <TimelinePostCard key={post.id} post={post} />
          ))}
          <RecommendedFeed />
        </>
      ) : (
        <FollowingFeed />
      )}
    </div>
  )
}
