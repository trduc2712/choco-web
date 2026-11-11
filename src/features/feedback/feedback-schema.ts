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
