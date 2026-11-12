import type { BadgeTone } from '@/components/badge/badge'
import type { IconName } from '@/components/icon/icon-paths'

import type { FeedbackStatus } from './feedback-admin-api'
import type { FeedbackCategory } from './feedback-schema'

export const STATUS_TONES: Record<FeedbackStatus, BadgeTone> = {
  new: 'info',
  in_progress: 'warning',
  resolved: 'success',
  wont_fix: 'neutral',
}

// How a category looks as a badge: an icon and a color that say what it is.
export const CATEGORY_BADGES: Record<
  FeedbackCategory,
  { icon: IconName; tone: BadgeTone }
> = {
  bug: { icon: 'bug', tone: 'danger' },
  suggestion: { icon: 'lightbulb', tone: 'warning' },
  other: { icon: 'more-horizontal', tone: 'neutral' },
}

// "Nov 1, 2026, 10:00 AM", in the language of the page.
export function formatDateTime(date: string, language: string | undefined) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

// What to call the sender: the display name, else the username.
export function authorName(author: { displayName: string; username: string }) {
  return author.displayName.trim() || author.username
}

// The first 7 characters of a commit SHA, the way git shows it.
export function shortVersion(version: string) {
  return version.slice(0, 7)
}

// A phone, tablet or computer icon for the width of the window the feedback
// was sent from.
export function deviceIcon(width: number): IconName {
  if (width < 640) return 'smartphone'
  if (width < 1024) return 'tablet'
  return 'monitor'
}

// "Chrome · Windows" from a user agent, or nothing when neither is recognised.
// Order matters: Edge and Opera also say Chrome, iPhone also says Mac OS X, and
// Android also says Linux.
export function describeUserAgent(userAgent: string): string {
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /OPR\//.test(userAgent)
      ? 'Opera'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Chrome\//.test(userAgent)
          ? 'Chrome'
          : /Safari\//.test(userAgent)
            ? 'Safari'
            : undefined
  const system = /Windows/.test(userAgent)
    ? 'Windows'
    : /iPhone|iPad|iPod/.test(userAgent)
      ? 'iOS'
      : /Android/.test(userAgent)
        ? 'Android'
        : /Mac OS X/.test(userAgent)
          ? 'macOS'
          : /Linux|X11/.test(userAgent)
            ? 'Linux'
            : undefined
  return [browser, system].filter(Boolean).join(' \u00b7 ')
}
