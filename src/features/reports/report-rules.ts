import type { Permission } from '@/features/current-user'
import { PERMISSIONS } from '@/features/current-user'

import type { ReportOutcome, ReportTargetType } from './reports-api'
import { REPORT_OUTCOMES } from './reports-api'

// What an outcome needs besides `reports.handle`.
const EXTRA_PERMISSION: Record<ReportOutcome, Permission | null> = {
  Dismissed: null,
  ContentRemoved: PERMISSIONS.deleteAnyPost,
  UserSuspended: PERMISSIONS.suspendUsers,
}

// The outcomes the viewer may choose for a report. The API still decides: a
// 403 is handled where it arrives. Removing content only makes sense for a
// report about a post, and suspending is pointless for a user who already is
// suspended.
export function availableOutcomes(
  targetType: ReportTargetType,
  granted: readonly string[],
  isTargetSuspended = false,
): ReportOutcome[] {
  if (!granted.includes(PERMISSIONS.handleReports)) return []
  return REPORT_OUTCOMES.filter((outcome) => {
    if (outcome === 'ContentRemoved' && targetType !== 'Post') return false
    if (outcome === 'UserSuspended' && isTargetSuspended) return false
    const extra = EXTRA_PERMISSION[outcome]
    return extra === null || granted.includes(extra)
  })
}
