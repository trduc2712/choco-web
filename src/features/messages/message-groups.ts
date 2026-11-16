import type { TimelineEntry } from './message-store'

// Messages from one sender this close together read as one run.
const GROUP_WINDOW_MS = 10 * 60_000
// After a pause this long the chat shows the time again, as Messenger does.
const TIME_BREAK_MS = 60 * 60_000

export type MessageRun = {
  key: string
  isMine: boolean
  // When the run starts; shown above it after a long pause.
  date: Date
  showsTime: boolean
  entries: TimelineEntry[]
}

export type MessageDay = {
  // Local calendar day, YYYY-MM-DD.
  key: string
  date: Date
  runs: MessageRun[]
}

export function entrySenderIsMine(entry: TimelineEntry, viewerId: string) {
  return entry.kind === 'pending' || entry.message.senderId === viewerId
}

export function entryDate(entry: TimelineEntry) {
  return new Date(
    entry.kind === 'sent' ? entry.message.createdAt : entry.pending.createdAt,
  )
}

export function localDayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

// Splits the entries (already in order) by local day, then into runs of
// consecutive messages from the same sender. A run also breaks at `breakAt`,
// the first unread message, so the "New messages" line can sit between runs.
export function groupEntries(
  entries: TimelineEntry[],
  viewerId: string,
  breakAt?: string,
): MessageDay[] {
  const days: MessageDay[] = []
  let previousTime = 0

  for (const entry of entries) {
    const date = entryDate(entry)
    const dayKey = localDayKey(date)
    const isMine = entrySenderIsMine(entry, viewerId)
    let day = days.at(-1)
    if (!day || day.key !== dayKey) {
      day = { key: dayKey, date, runs: [] }
      days.push(day)
    }
    const run = day.runs.at(-1)
    if (
      run &&
      run.isMine === isMine &&
      entry.key !== breakAt &&
      date.getTime() - previousTime < GROUP_WINDOW_MS
    ) {
      run.entries.push(entry)
    } else {
      day.runs.push({
        key: entry.key,
        isMine,
        date,
        showsTime:
          day.runs.length > 0 && date.getTime() - previousTime >= TIME_BREAK_MS,
        entries: [entry],
      })
    }
    previousTime = date.getTime()
  }
  return days
}
