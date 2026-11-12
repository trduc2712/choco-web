import type { IconName } from '@/components/icon/icon-paths'
import {
  ADMIN_AUDIT_LOG_PATH,
  ADMIN_FEEDBACK_PATH,
  ADMIN_REPORTS_PATH,
} from '@/constants/routes'
import type { Permission } from '@/features/current-user'
import { PERMISSIONS } from '@/features/current-user'

import type { AdminCountKey } from './admin-counts-api'

export type AdminScreenId = 'feedback' | 'reports' | 'auditLog'
export type AdminGroupId = 'moderation' | 'system'

export type AdminScreen = {
  id: AdminScreenId
  group: AdminGroupId
  to: string
  icon: IconName
  // The permission that opens the screen.
  permission: Permission
  // The count shown as a badge on the nav entry, if the screen has one.
  countKey?: AdminCountKey
}

// Every admin screen, in nav order. The nav, the routes and the page headers
// all read this list.
export const ADMIN_SCREENS: readonly AdminScreen[] = [
  {
    id: 'feedback',
    group: 'moderation',
    to: ADMIN_FEEDBACK_PATH,
    icon: 'message-smile',
    permission: PERMISSIONS.readAnyFeedback,
    countKey: 'newFeedback',
  },
  {
    id: 'reports',
    group: 'moderation',
    to: ADMIN_REPORTS_PATH,
    icon: 'file-warning',
    permission: PERMISSIONS.handleReports,
    countKey: 'openReports',
  },
  {
    id: 'auditLog',
    group: 'system',
    to: ADMIN_AUDIT_LOG_PATH,
    icon: 'clipboard-list',
    permission: PERMISSIONS.readAuditLog,
  },
]

// Holding any of these opens the admin area.
export const ADMIN_PERMISSIONS: readonly Permission[] = ADMIN_SCREENS.map(
  (screen) => screen.permission,
)
