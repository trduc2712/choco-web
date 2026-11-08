import { useEffect, useState } from 'react'

const DEBOUNCE_MS = 200

export function useDebouncedQuery(query: string, enabled: boolean) {
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const isDebouncing = query !== debouncedQuery

  useEffect(() => {
    if (!enabled || !isDebouncing) return
    const timer = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [enabled, isDebouncing, query])

  return {
    isDebouncing,
    resetDebounce: () => setDebouncedQuery(''),
  }
}
