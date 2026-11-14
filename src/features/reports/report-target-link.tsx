import { useAuth } from '@clerk/react'
import { queryOptions, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import {
  ADMIN_POSTS_PATH,
  userPostPath,
  userProfilePath,
} from '@/constants/routes'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import type { ApiFetch } from '@/lib/api-client'
import { ApiError, useApiFetch } from '@/lib/api-client'

import type { AdminReport } from './reports-api'

function reportTargetQuery(
  apiFetch: ApiFetch,
  viewerId: string | null | undefined,
  report: AdminReport,
) {
  const { targetType, targetId } = report
  return queryOptions({
    queryKey: ['report-target', viewerId, targetType, targetId] as const,
    queryFn: async ({ signal }) => {
      const id = encodeURIComponent(targetId)
      if (targetType === 'Post') {
        const post = await apiFetch<{ author: { username: string | null } }>(
          `/posts/${id}`,
          { signal },
        )
        return post.author.username
          ? userPostPath(post.author.username, targetId)
          : null
      }

      const user = await apiFetch<{ username: string | null }>(`/users/${id}`, {
        signal,
      })
      return user.username ? userProfilePath(user.username) : null
    },
  })
}

export function ReportTargetLink({ report }: { report: AdminReport }) {
  const { t } = useTranslation()
  const { userId } = useAuth()
  const { can } = usePermissions()
  const apiFetch = useApiFetch()
  const target = useQuery(reportTargetQuery(apiFetch, userId, report))

  if (target.data) {
    return (
      <Link to={target.data}>
        {t(
          report.targetType === 'Post'
            ? 'admin.reports.all.openPost'
            : 'admin.reports.all.openUser',
        )}
      </Link>
    )
  }

  const error = target.error
  const unavailable =
    target.data === null ||
    (error instanceof ApiError && [403, 404, 410].includes(error.status))

  return (
    <div role="status">
      <Text size="sm" tone="muted">
        {t(
          unavailable
            ? 'admin.reports.all.targetUnavailable'
            : target.isPending
              ? 'admin.reports.all.targetLoading'
              : 'admin.reports.all.targetError',
        )}
      </Text>
      {unavailable &&
      report.targetType === 'Post' &&
      can(PERMISSIONS.readAnyContent) ? (
        <Link
          to={`${ADMIN_POSTS_PATH}?${new URLSearchParams({ state: 'deleted', selected: report.targetId })}`}
        >
          {t('admin.content.browsePosts')}
        </Link>
      ) : null}
      {target.isError && !unavailable ? (
        <Button
          size="sm"
          variant="secondary"
          isLoading={target.isFetching}
          onClick={() => void target.refetch()}
        >
          {t('admin.listError.retry')}
        </Button>
      ) : null}
    </div>
  )
}
