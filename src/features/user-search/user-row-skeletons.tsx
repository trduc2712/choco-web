import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import styles from './user-search.module.scss'

// The name and @username beside an avatar, at UserCard's own sizes.
export function UserIdentitySkeleton() {
  return (
    <span className={styles.identitySkeleton}>
      <Skeleton
        shape="circle"
        width="var(--size-avatar-md)"
        height="var(--size-avatar-md)"
      />
      <span className={styles.identityLines}>
        <Text as="span" size="sm" className={styles.skeletonLine}>
          <Skeleton width="var(--space-9)" />
        </Text>
        <Text as="span" size="xs" className={styles.skeletonLine}>
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
        className={cx(styles.resultsList, isCompact && styles.compactResults)}
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, index) => (
          <li key={index} className={styles.resultItem}>
            <span className={styles.resultLink}>
              <UserIdentitySkeleton />
            </span>
            <Skeleton
              shape="rect"
              width="var(--space-9)"
              height="var(--size-control-sm)"
              className={cx(
                styles.actionSkeleton,
                isCompact && styles.pillSkeleton,
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
    <ul className={styles.listbox} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={styles.optionSkeleton}>
          <UserIdentitySkeleton />
        </li>
      ))}
    </ul>
  )
}
