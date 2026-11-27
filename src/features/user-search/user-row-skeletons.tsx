import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

// The name and @username beside an avatar, at UserCard's own sizes.
export function UserIdentitySkeleton() {
  return (
    <span>
      <Skeleton
        shape="circle"
        width="var(--size-avatar-md)"
        height="var(--size-avatar-md)"
      />
      <span>
        <Text as="span" size="sm">
          <Skeleton width="var(--space-9)" />
        </Text>
        <Text as="span" size="xs">
          <Skeleton width="var(--space-8)" />
        </Text>
      </span>
    </span>
  )
}

// Stands in for UserResultList while its first page loads. The rows use the
// list's own classes, so each placeholder is as tall as a real row.
export function UserRowSkeletons({
  label,
  count = 5,
  isCompact = false,
}: {
  label: string
  count?: number
  isCompact?: boolean
}) {
  return (
    <div role="status">
      <VisuallyHidden>{label}</VisuallyHidden>
      <ul
        className={cx(
          'user-search-resultsList',
          isCompact && 'user-search-compactResults',
        )}
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, index) => (
          <li key={index}>
            <span>
              <UserIdentitySkeleton />
            </span>
            <Skeleton
              shape="rect"
              width="var(--space-9)"
              height="var(--size-control-sm)"
              className={cx(
                'user-search-actionSkeleton',
                isCompact && 'user-search-pillSkeleton',
              )}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

// Option-shaped rows for the search popup while suggestions load.
export function UserOptionSkeletons({ count = 3 }: { count?: number }) {
  return (
    <ul aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <UserIdentitySkeleton />
        </li>
      ))}
    </ul>
  )
}
