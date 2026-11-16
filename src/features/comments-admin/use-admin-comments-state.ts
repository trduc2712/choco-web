import { useSearchParams } from 'react-router'

import { useAdminPaging } from '@/features/admin'

import type {
  AdminCommentFilters,
  CommentPeriod,
  CommentState,
} from './admin-comments-api'
import {
  COMMENT_PERIODS,
  COMMENT_SEARCH_MAX_LENGTH,
} from './admin-comments-api'

export type CommentsView = 'posts' | 'all'

export function getAdminCommentsView(search: URLSearchParams): CommentsView {
  const view = search.get('view')
  if (view === 'all' || view === 'posts') return view
  return search.get('post') ? 'posts' : 'all'
}

const PAGE_SIZE_KEY = 'choco.admin.comments.pageSize'

const PERIOD_HOURS: Record<CommentPeriod, number> = {
  day: 24,
  week: 7 * 24,
  month: 30 * 24,
}

const HOUR_MS = 60 * 60 * 1000

// The start of a period, rounded down to the hour so the query key stays the
// same between renders.
function periodStart(period: CommentPeriod) {
  const hour = Math.floor(Date.now() / HOUR_MS) * HOUR_MS
  return new Date(hour - PERIOD_HOURS[period] * HOUR_MS).toISOString()
}

type Changes = {
  view?: CommentsView | null
  q?: string | null
  state?: CommentState | null
  period?: CommentPeriod | null
  post?: string | null
  postId?: string | null
  authorId?: string | null
}

// Everything the comments screen keeps in the URL: the tab, the filters, the
// chosen post, the page and the page size. A reload or a shared link brings
// them back. Changing a filter goes back to page 1. An unknown value is no
// filter.
export function useAdminCommentsState() {
  const [search, setSearch] = useSearchParams()
  const paging = useAdminPaging(PAGE_SIZE_KEY)

  const q =
    (search.get('q') ?? '').trim().slice(0, COMMENT_SEARCH_MAX_LENGTH) ||
    undefined
  const state: CommentState =
    search.get('state') === 'deleted' ? 'deleted' : 'visible'
  const period = COMMENT_PERIODS.find((value) => value === search.get('period'))

  const filters: AdminCommentFilters = {
    state,
    q,
    from: period ? periodStart(period) : undefined,
  }

  function update(changes: Changes, { keepPage = false } = {}) {
    setSearch(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [name, value] of Object.entries(changes)) {
          // The defaults stay out of the URL.
          if (
            value === null ||
            value === undefined ||
            (name === 'state' && value === 'visible')
          )
            next.delete(name)
          else next.set(name, value)
        }
        if (!keepPage) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  return {
    filters,
    period,
    // The post open in the thread pane, on the Posts tab.
    selectedPostId: search.get('post') ?? undefined,
    // Narrow the All comments tab to one post or one author.
    postId: search.get('postId') ?? undefined,
    authorId: search.get('authorId') ?? undefined,
    isFiltered:
      q !== undefined ||
      state !== 'visible' ||
      period !== undefined ||
      search.has('postId') ||
      search.has('authorId'),
    update,
    page: paging.page,
    pageSize: paging.pageSize,
    setPage: paging.setPage,
    setPageSize: paging.setPageSize,
  }
}

export type AdminCommentsState = ReturnType<typeof useAdminCommentsState>
