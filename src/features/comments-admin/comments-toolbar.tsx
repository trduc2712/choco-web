import { useTranslation } from 'react-i18next'

import { Select } from '@/components/select/select'
import {
  AdminFilterField,
  AdminSearchField,
  AdminToolbar,
} from '@/features/admin'

import type { CommentPeriod } from './admin-comments-api'
import {
  COMMENT_PERIODS,
  COMMENT_SEARCH_MAX_LENGTH,
  COMMENT_STATES,
} from './admin-comments-api'
import type { AdminCommentsState } from './use-admin-comments-state'

// The search and filters both tabs share; they stay in the URL when switching.
export function CommentsToolbar({
  state: list,
  className,
}: {
  state: AdminCommentsState
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <div className={className}>
      <AdminToolbar
        isFiltered={list.isFiltered}
        onReset={() =>
          list.update({
            q: null,
            state: null,
            period: null,
            post: null,
            postId: null,
            authorId: null,
          })
        }
      >
        <AdminSearchField
          label={t('admin.comments.search.label')}
          placeholder={t('admin.comments.search.placeholder')}
          value={list.filters.q ?? ''}
          maxLength={COMMENT_SEARCH_MAX_LENGTH}
          onChange={(value) =>
            list.update({ q: value.trim() || null, post: null })
          }
        />
        <Select
          label={t('admin.comments.filters.state')}
          value={list.filters.state}
          options={COMMENT_STATES.map((value) => ({
            value,
            label: t(`admin.comments.states.${value}`),
          }))}
          onChange={(value) =>
            list.update({
              state: value === 'deleted' ? 'deleted' : null,
              post: null,
            })
          }
        />
        <AdminFilterField
          label={t('admin.comments.filters.period')}
          value={list.period}
          options={COMMENT_PERIODS.map((value) => ({
            value,
            label: t(`admin.comments.periods.${value}`),
          }))}
          onChange={(value) =>
            list.update({
              period: (value as CommentPeriod | undefined) ?? null,
              post: null,
            })
          }
        />
      </AdminToolbar>
    </div>
  )
}
