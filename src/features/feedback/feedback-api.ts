import { useMutation } from '@tanstack/react-query'

import { ApiError, useApiFetch } from '@/lib/api-client'

import type { FeedbackContext } from './feedback-context'
import type { FeedbackCategory } from './feedback-schema'

export type FeedbackInput = {
  category: FeedbackCategory
  message: string
  context: FeedbackContext
}

type FeedbackCreated = { id: string; createdAt: string }

export type FeedbackFieldErrors = {
  message?: string
  category?: string
  // "Context.*" errors mean the app built a bad context; never shown to users.
  hasContextError: boolean
}

// A 400 keys its errors by field name: "Message", "Category", "Context.Path"...
export function feedbackFieldErrors(error: unknown): FeedbackFieldErrors {
  const result: FeedbackFieldErrors = { hasContextError: false }
  if (!(error instanceof ApiError) || error.status !== 400) return result

  for (const [key, messages] of Object.entries(error.errors ?? {})) {
    const name = key.toLowerCase()
    if (name === 'message') result.message = messages[0]
    else if (name === 'category') result.category = messages[0]
    else if (name.startsWith('context')) result.hasContextError = true
  }
  return result
}

// `Retry-After` is a number of seconds; an HTTP date gives no usable wait.
export function retryAfterSeconds(error: unknown): number | undefined {
  if (!(error instanceof ApiError) || error.status !== 429) return undefined
  const seconds = Number(error.retryAfter)
  return Number.isFinite(seconds) && seconds > 0
    ? Math.ceil(seconds)
    : undefined
}

// "12 minutes" in the given language; whole minutes, or seconds under one.
export function formatWait(seconds: number, language: string): string {
  const [unit, value] =
    seconds < 60
      ? (['second', seconds] as const)
      : (['minute', Math.ceil(seconds / 60)] as const)
  return new Intl.NumberFormat(language, {
    style: 'unit',
    unit,
    unitDisplay: 'long',
  }).format(value)
}

export function useSendFeedback() {
  const apiFetch = useApiFetch()

  return useMutation({
    mutationKey: ['send-feedback'],
    retry: false,
    mutationFn: ({ category, message, context }: FeedbackInput) =>
      apiFetch<FeedbackCreated>('/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, message: message.trim(), context }),
      }),
    onError: (error) => {
      if (feedbackFieldErrors(error).hasContextError) {
        console.error('Feedback context was rejected', error)
      }
    },
  })
}
