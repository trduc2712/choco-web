import { useMutation } from '@tanstack/react-query'

import { useApiFetch } from '@/lib/api-client'

import type { ReportReason } from './reports-api'

// The longest explanation the API accepts.
export const REPORT_DETAILS_MAX_LENGTH = 500

// What a person reports: a post or a user, by id.
export type ReportTarget = { type: 'Post' | 'User'; id: string }

// Reports a post or a user to the administrators. Reporting what the caller
// already has an open report on changes nothing and still answers 201, so a
// repeat is harmless. A person cannot report their own post or account.
export function useCreateReport() {
  const apiFetch = useApiFetch()
  return useMutation({
    mutationFn: ({
      target,
      reason,
      details,
    }: {
      target: ReportTarget
      reason: ReportReason
      details: string | null
    }) =>
      apiFetch<void>(
        `/${target.type === 'Post' ? 'posts' : 'users'}/${encodeURIComponent(target.id)}/reports`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, details }),
        },
      ),
  })
}
