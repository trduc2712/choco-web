import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Banner } from '@/components/banner/banner'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import { Spinner } from '@/components/spinner/spinner'
import { Stack } from '@/components/stack/stack'
import { Tabs } from '@/components/tabs/tabs'
import type { useProfilePosts } from '@/features/posts'
import { TextTimelinePost } from '@/features/posts'

import styles from './profile-posts.module.scss'
import tabStyles from './profile-tabs.module.scss'

type ProfilePostsProps = {
  posts: ReturnType<typeof useProfilePosts>
}

export function ProfilePosts(props: ProfilePostsProps) {
  const { t } = useTranslation()

  return (
    <Tabs
      label={t('profile.activity')}
      className={tabStyles.tabs}
      items={[
        {
          id: 'posts',
          label: t('profile.posts'),
          content: <ProfilePostList {...props} />,
        },
        {
          id: 'replies',
          label: t('profile.replies'),
          content: (
            <Banner tone="info" role="status">
              {t('profile.repliesUnavailable')}
            </Banner>
          ),
        },
        {
          id: 'media',
          label: t('profile.media'),
          content: (
            <Banner tone="info" role="status">
              {t('profile.mediaUnavailable')}
            </Banner>
          ),
        },
      ]}
    />
  )
}

function ProfilePostList({ posts }: ProfilePostsProps) {
  const { t } = useTranslation()

  if (posts.isPending) {
    return (
      <Stack align="center" className={styles.controls}>
        <Spinner />
      </Stack>
    )
  }

  if (!posts.data) {
    return (
      <EmptyState
        size="sm"
        role="alert"
        title={t('posts.loadError')}
        action={
          <Button
            variant="secondary"
            onClick={() => void posts.refetch()}
            isLoading={posts.isFetching}
          >
            {t('common.retry')}
          </Button>
        }
      />
    )
  }

  const items = posts.data.pages.flatMap((page) => page.items)
  if (items.length === 0) {
    return <EmptyState size="sm" title={t('posts.empty')} />
  }

  return (
    <>
      {items.map((post) => (
        <TextTimelinePost key={post.id} post={post} />
      ))}
      {posts.hasNextPage ? (
        <Stack align="center" className={styles.controls}>
          {posts.isFetchNextPageError ? (
            <Alert tone="danger" role="alert">
              {t('posts.loadError')}
            </Alert>
          ) : null}
          <Button
            variant="secondary"
            disabled={posts.isFetching}
            isLoading={posts.isFetchingNextPage}
            onClick={() => void posts.fetchNextPage({ cancelRefetch: false })}
          >
            {t('posts.loadMore')}
          </Button>
        </Stack>
      ) : null}
    </>
  )
}
