import { useTranslation } from 'react-i18next'

import { Link } from '@/components/link/link'
import { Text } from '@/components/text/text'
import {
  ADMIN_POSTS_PATH,
  userPostPath,
  userProfilePath,
} from '@/constants/routes'
import { PERMISSIONS, usePermissions } from '@/features/current-user'

import type { AdminReport } from './reports-api'

// Where the reported post or user lives, from the summary the report carries.
// null when the target was deleted, or a post's author has no username any more.
function targetPath(report: AdminReport) {
  if (report.post) {
    const { username } = report.post.author
    return username ? userPostPath(username, report.targetId) : null
  }
  return report.user ? userProfilePath(report.user.username) : null
}

export function ReportTargetLink({ report }: { report: AdminReport }) {
  const { t } = useTranslation()
  const { can } = usePermissions()
  const path = targetPath(report)

  if (path) {
    return (
      <Link to={path}>
        {t(
          report.targetType === 'Post'
            ? 'admin.reports.all.openPost'
            : 'admin.reports.all.openUser',
        )}
      </Link>
    )
  }

  return (
    <div role="status">
      <Text size="sm" tone="muted">
        {t('admin.reports.all.targetUnavailable')}
      </Text>
      {report.targetType === 'Post' && can(PERMISSIONS.readAnyContent) ? (
        <Link
          to={`${ADMIN_POSTS_PATH}?${new URLSearchParams({ state: 'deleted', selected: report.targetId })}`}
        >
          {t('admin.content.browsePosts')}
        </Link>
      ) : null}
    </div>
  )
}
