import type { AuditEntry } from '../audit-log-api'
import type { DayGroup } from '../audit-log-format'
import type { EntryFilter } from '../audit-parts'

export type ViewProps = {
  // The entries of the page on screen, grouped by day.
  groups: DayGroup[]
  entries: AuditEntry[]
  canBrowsePosts?: boolean
  // The entry open in the split view.
  selectedId: string | null
  onSelect: (id: string | null) => void
  onFilter: (kind: EntryFilter, entry: AuditEntry) => void
}
