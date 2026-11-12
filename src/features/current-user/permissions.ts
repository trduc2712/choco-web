// Permission codes from choco-api's catalog. The client only uses them to show
// or hide UI; choco-api still answers 403 to a caller who lacks one.
export const PERMISSIONS = {
  assignRoles: 'roles.assign',
  deleteAnyPost: 'posts.delete-any',
  deleteAnyComment: 'comments.delete-any',
  handleReports: 'reports.handle',
  readAnyFeedback: 'feedback.read-any',
  changeFeedbackStatus: 'feedback.change-status',
  readAuditLog: 'audit-log.read',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
