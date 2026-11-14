import { useMutation } from '@tanstack/react-query'
import type { TFunction } from 'i18next'

import { ApiError, useApiFetch } from '@/lib/api-client'
import { apiFieldErrors, apiFieldIssues } from '@/lib/api-errors'

import type { FeedbackRequestContext } from './feedback-context'
import type { FeedbackCategory } from './feedback-schema'

export type FeedbackInput = {
  category: FeedbackCategory
  message: string
  context: FeedbackRequestContext
}

type FeedbackCreated = { id: string; createdAt: string }

export type FeedbackFieldErrors = {
  message?: string
  category?: string
}

// "context" and "context.*" errors mean the app built a bad context; they are
// never shown to users.
export function hasFeedbackContextError(error: unknown): boolean {
  return apiFieldIssues(error).some(
    ({ field }) => field === 'context' || field.startsWith('context.'),
  )
}

// A 400 keys its errors by camelCase field name: "message", "category",
// "context.path"... Each shows its text translated by code.
export function feedbackFieldErrors(
  error: unknown,
  t: TFunction,
): FeedbackFieldErrors {
  const { message, category } = apiFieldErrors(error, t)
  return { message, category }
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
      if (hasFeedbackContextError(error)) {
        console.error('Feedback context was rejected', {
          traceId: error instanceof ApiError ? error.traceId : undefined,
          errorCodes: error instanceof ApiError ? error.errorCodes : undefined,
        })
      }
    },
  })
}
