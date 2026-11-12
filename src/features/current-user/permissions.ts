import type { TFunction } from 'i18next'

// Permission codes from choco-api's catalog. The client only uses them to show
// or hide UI; choco-api still answers 403 to a caller who lacks one.
export const PERMISSIONS = {
  assignRoles: 'roles.assign',
  readRoles: 'roles.read',
  createRoles: 'roles.create',
  updateRoles: 'roles.update',
  deleteRoles: 'roles.delete',
  deleteAnyPost: 'posts.delete-any',
  deleteAnyComment: 'comments.delete-any',
  handleReports: 'reports.handle',
  readAnyFeedback: 'feedback.read-any',
  changeFeedbackStatus: 'feedback.change-status',
  readAuditLog: 'audit-log.read',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

// i18n key of each known code. A code holds dots and dashes, which i18n keys
// cannot, so the label key is spelled out here.
const LABEL_KEYS: Record<Permission, string> = {
  'roles.assign': 'rolesAssign',
  'roles.read': 'rolesRead',
  'roles.create': 'rolesCreate',
  'roles.update': 'rolesUpdate',
  'roles.delete': 'rolesDelete',
  'posts.delete-any': 'postsDeleteAny',
  'comments.delete-any': 'commentsDeleteAny',
  'reports.handle': 'reportsHandle',
  'feedback.read-any': 'feedbackReadAny',
  'feedback.change-status': 'feedbackChangeStatus',
  'audit-log.read': 'auditLogRead',
}

export function isKnownPermission(code: string): code is Permission {
  return Object.prototype.hasOwnProperty.call(LABEL_KEYS, code)
}

// What a person reads for a code. The API grows new codes before the app has
// words for them, so an unknown code shows as itself.
export function permissionLabel(code: string, t: TFunction): string {
  return isKnownPermission(code)
    ? String(t(`permissions.${LABEL_KEYS[code]}` as never))
    : code
}
