import type { BadgeTone } from '@/components/badge/badge'
import type { IconName } from '@/components/icon/icon-paths'

import type { FeedbackStatus } from './feedback-admin-api'
import type { FeedbackCategory } from './feedback-schema'

// How a status looks as a badge. Yellow belongs to "in progress" alone, so a
// category never shares a color with the status beside it.
export const STATUS_BADGES: Record<
  FeedbackStatus,
  { icon: IconName; tone: BadgeTone }
> = {
  new: { icon: 'circle-dot', tone: 'info' },
  in_progress: { icon: 'clock', tone: 'warning' },
  resolved: { icon: 'check-circle', tone: 'success' },
  wont_fix: { icon: 'ban', tone: 'neutral' },
}

// How a category looks as a badge: an icon and a color that say what it is.
export const CATEGORY_BADGES: Record<
  FeedbackCategory,
  { icon: IconName; tone: BadgeTone }
> = {
  bug: { icon: 'bug', tone: 'danger' },
  suggestion: { icon: 'lightbulb', tone: 'primary' },
  other: { icon: 'message', tone: 'neutral' },
}

// "Nov 1, 2026, 10:00 AM", in the language of the page.
export function formatDateTime(date: string, language: string | undefined) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

// "Nov 1, 2026, 10:00:00 AM GMT+7": the same moment with the time zone it is
// shown in. Times are shown in the viewer's own zone, so two admins in
// different places read different clocks; the zone says which.
export function formatDateTimeZone(date: string, language: string | undefined) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'long',
  }).format(new Date(date))
}

// The same moment in UTC, for checking against logs and servers.
export function formatDateTimeUtc(date: string, language: string | undefined) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'long',
    timeZone: 'UTC',
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

// The browser and the system a user agent names: "Chrome" and "Windows", each
// with the detail the user agent gives about it ("130.0" and "X11; Linux
// x86_64"). Any of them is missing when it is not there or not recognised.
// Order matters: Edge and Opera also say Chrome, iPhone also says Mac OS X,
// and Android also says Linux.
export function userAgentParts(userAgent: string): {
  browser?: string
  browserVersion?: string
  system?: string
  systemDetail?: string
} {
  const [browser, versionPattern] = /Edg\//.test(userAgent)
    ? (['Edge', /Edg\/([\d.]+)/] as const)
    : /OPR\//.test(userAgent)
      ? (['Opera', /OPR\/([\d.]+)/] as const)
      : /Firefox\//.test(userAgent)
        ? (['Firefox', /Firefox\/([\d.]+)/] as const)
        : /Chrome\//.test(userAgent)
          ? (['Chrome', /Chrome\/([\d.]+)/] as const)
          : /Safari\//.test(userAgent)
            ? (['Safari', /Version\/([\d.]+)/] as const)
            : ([undefined, undefined] as const)
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
  return {
    browser,
    browserVersion: versionPattern
      ? userAgent.match(versionPattern)?.[1]
      : undefined,
    system,
    // The first group in parentheses names the platform.
    systemDetail: system ? userAgent.match(/\(([^)]*)\)/)?.[1] : undefined,
  }
}

// "Chrome · Windows" from a user agent, or nothing when neither is recognised.
export function describeUserAgent(userAgent: string): string {
  const { browser, system } = userAgentParts(userAgent)
  return [browser, system].filter(Boolean).join(' \u00b7 ')
}
