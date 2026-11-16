import { BlockedUsersSkeleton } from '@/features/blocks'

// The page's own shape while the session or the page loads.
export function BlockedUsersPageFallback() {
  return (
    <section>
      <BlockedUsersSkeleton />
    </section>
  )
}
