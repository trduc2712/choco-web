import type { TFunction } from 'i18next'

import { localDayKey } from './message-groups'

function daysBetween(date: Date, now: Date) {
  const start = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime()
  return Math.round((start(now) - start(date)) / 86_400_000)
}

// "14:05" or "2:05 PM", as the language writes it.
export function formatMessageTime(date: Date, language: string | undefined) {
  return new Intl.DateTimeFormat(language, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

// The line between days: Today, Yesterday, then the date.
export function formatDayLabel(
  date: Date,
  language: string | undefined,
  t: TFunction,
  now: Date = new Date(),
) {
  if (localDayKey(date) === localDayKey(now)) return t('messages.today')
  if (daysBetween(date, now) === 1) return t('messages.yesterday')
  return new Intl.DateTimeFormat(language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date)
}

// The inbox's short time: the time today, the weekday this week, else a date.
export function formatInboxTime(
  date: Date,
  language: string | undefined,
  now: Date = new Date(),
) {
  const days = daysBetween(date, now)
  if (days <= 0) return formatMessageTime(date, language)
  if (days < 7) {
    return new Intl.DateTimeFormat(language, { weekday: 'short' }).format(date)
  }
  return new Intl.DateTimeFormat(language, {
    month: 'short',
    day: 'numeric',
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date)
}

// Full date and time, for a time element's title.
export function formatFullDate(date: Date, language: string | undefined) {
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(date)
}

// The name to show for someone: their display name, or the username.
export function displayName(user: { displayName: string; username: string }) {
  return user.displayName.trim() || user.username
}
