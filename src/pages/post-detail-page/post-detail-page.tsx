import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/empty-state/empty-state'
import { HOME_PATH } from '@/constants/routes'
import { PostDetailDialog } from '@/features/post-detail'
import { HomePage } from '@/pages/home-page/home-page'

// A post opens in a large dialog over the timeline, like Facebook's. Closing
// goes back to where the reader came from, or home when the link was opened
// directly.
export function PostDetailPage() {
  const { t } = useTranslation()
  const { postId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  if (!postId) {
    return <EmptyState headingLevel={1} title={t('notFound.title')} />
  }

  function close() {
    if (location.key === 'default') {
      void navigate(HOME_PATH, { replace: true })
    } else {
      void navigate(-1)
    }
  }

  return (
    <>
      <HomePage />
      <PostDetailDialog key={postId} postId={postId} onClose={close} />
    </>
  )
}
