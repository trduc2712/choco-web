import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Tabs } from '@/components/tabs/tabs'
import {
  AllComments,
  CommentsByPost,
  getAdminCommentsView,
} from '@/features/comments-admin'
import { cx } from '@/lib/cx'

export function AdminCommentsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useSearchParams()
  const view = getAdminCommentsView(search)

  return (
    <section
      className={cx(
        'admin-comments-page-root',
        view === 'posts' && 'admin-comments-page-fit',
      )}
    >
      <header>
        <h1>{t('admin.screens.comments')}</h1>
      </header>
      <Tabs
        label={t('admin.comments.views.label')}
        value={view}
        items={[
          {
            id: 'posts',
            label: t('admin.comments.views.posts'),
            content: <CommentsByPost />,
          },
          {
            id: 'all',
            label: t('admin.comments.views.all'),
            content: <AllComments />,
          },
        ]}
        onChange={(next) => {
          if (next === view) return
          // The search and filters carry over; the page and the chosen post
          // belong to the tab being left.
          const params = new URLSearchParams(search)
          params.delete('page')
          params.delete('post')
          params.set('view', next)
          if (next === 'posts') {
            params.delete('postId')
            params.delete('authorId')
          }
          setSearch(params)
        }}
      />
    </section>
  )
}
