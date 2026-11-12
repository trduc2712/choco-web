import { z } from 'zod'

export const FEEDBACK_CATEGORIES = ['bug', 'suggestion', 'other'] as const

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number]

export const FEEDBACK_MESSAGE_MIN_LENGTH = 10
export const FEEDBACK_MESSAGE_MAX_LENGTH = 2000

// choco-api trims the message, so count what it will count.
export function feedbackLength(text: string): number {
  return text.trim().length
}

export type FeedbackMessageIssue = 'tooShort' | 'tooLong'

const feedbackMessageSchema = z
  .string()
  .trim()
  .min(FEEDBACK_MESSAGE_MIN_LENGTH, { error: 'tooShort' })
  .max(FEEDBACK_MESSAGE_MAX_LENGTH, { error: 'tooLong' })

export function validateFeedbackMessage(
  message: string,
): FeedbackMessageIssue | undefined {
  const result = feedbackMessageSchema.safeParse(message)
  if (result.success) return undefined
  return result.error.issues[0].message as FeedbackMessageIssue
}

// The longest search the API takes, and the most words of `q` it looks for.
export const FEEDBACK_SEARCH_MAX_LENGTH = 100
export const FEEDBACK_SEARCH_MAX_WORDS = 5

// A search as the API reads it: trimmed and cut to the length it takes, so a long
// paste is searched, not refused with a 400.
export function toSearchText(value: string): string {
  return value.trim().slice(0, FEEDBACK_SEARCH_MAX_LENGTH).trim()
}

// The words of `q` the API looks for, to mark in the results.
export function searchWords(q: string): string {
  return q
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, FEEDBACK_SEARCH_MAX_WORDS)
    .join(' ')
}
