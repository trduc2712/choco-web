import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'

import { EmptyState } from '@/components/empty-state/empty-state'
import { ScrollArea } from '@/components/scroll-area/scroll-area'
import { PostDetailScreen } from '@/features/post-detail'

import styles from '../profile-page/profile-page.module.scss'

export function PostDetailPage() {
  const { t } = useTranslation()
  const { postId } = useParams()

  return (
    <ScrollArea
      className={styles.page}
      label={t('postDetail.title')}
      maxHeight="var(--profile-scroll-height)"
    >
      {postId ? (
        <PostDetailScreen key={postId} postId={postId} />
      ) : (
        <EmptyState headingLevel={1} title={t('notFound.title')} />
      )}
    </ScrollArea>
  )
}
