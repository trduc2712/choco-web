import { useFeedTab } from '@/features/feed'
import { PostComposerSkeleton } from '@/features/post-composer'
import { FEED_SKELETON_COUNT, PostCardSkeletons } from '@/features/posts'

import styles from './home-page.module.scss'

// One wait for the whole home load: the session check, the page chunk and the
// first feed page all show this same layout, so nothing jumps between them.
export function HomePageFallback() {
  const { tab } = useFeedTab()

  return (
    <div className={styles.timeline}>
      {tab === 'feed' ? <PostComposerSkeleton /> : null}
      <PostCardSkeletons count={FEED_SKELETON_COUNT} />
    </div>
  )
}
