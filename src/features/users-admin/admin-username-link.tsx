import { Highlight } from '@/components/highlight/highlight'
import { HoverCard } from '@/components/hover-card/hover-card'
import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { userProfilePath } from '@/constants/routes'
import { PERMISSIONS, usePermissions } from '@/features/current-user'
import { cx } from '@/lib/cx'

import { adminUserPath } from './admin-user-path'
import { AdminUserPreview } from './admin-user-preview'

export function AdminUsernameLink({
  userId,
  username,
  highlight,
  className,
  showUserIcon = false,
}: {
  userId: string
  username: string
  highlight?: string
  className?: string
  showUserIcon?: boolean
}) {
  const { can } = usePermissions()
  const canViewUsers = can(PERMISSIONS.readAnyUser)
  const link = (
    <Link
      to={canViewUsers ? adminUserPath(userId) : userProfilePath(username)}
      variant="subtle"
      className={cx('admin-username-link-link', className)}
    >
      {showUserIcon ? <Icon name="user" size="sm" /> : '@'}
      {highlight ? (
        <Highlight text={username} query={highlight} isPhrase />
      ) : (
        username
      )}
    </Link>
  )

  return canViewUsers ? (
    <HoverCard trigger={link} placement="bottom-start">
      <AdminUserPreview userId={userId} />
    </HoverCard>
  ) : (
    link
  )
}
