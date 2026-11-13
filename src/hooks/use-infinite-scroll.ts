import { useEffect, useState } from 'react'

type UseInfiniteScrollOptions = {
  hasNextPage: boolean
  // True while any request for the list is in flight.
  isFetching: boolean
  // Stops the automatic loading, e.g. after a failed page, so the reader can
  // retry by hand instead of the list hammering a failing request.
  isPaused?: boolean
  onLoadMore: () => void
}

// Loads the next page when the sentinel scrolls near the viewport. Put the ref
// on an element after the last item. `isAutomatic` is false where there is no
// IntersectionObserver, so the caller can fall back to a button.
export function useInfiniteScroll({
  hasNextPage,
  isFetching,
  isPaused = false,
  onLoadMore,
}: UseInfiniteScrollOptions) {
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null)
  const isAutomatic = typeof IntersectionObserver !== 'undefined'

  useEffect(() => {
    if (!sentinel || !isAutomatic || !hasNextPage || isFetching || isPaused) {
      return
    }

    // The observer reports the current state when it starts, so a sentinel
    // that is still in view after a page arrives loads the next one.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore()
      },
      { rootMargin: '400px' },
    )
    observer.observe(sentinel)

    return () => observer.disconnect()
  }, [sentinel, isAutomatic, hasNextPage, isFetching, isPaused, onLoadMore])

  return { sentinelRef: setSentinel, isAutomatic }
}
