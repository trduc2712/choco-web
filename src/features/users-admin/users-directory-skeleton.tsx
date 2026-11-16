import { Card } from '@/components/card/card'
import { Skeleton } from '@/components/skeleton/skeleton'
import { cx } from '@/lib/cx'

import { useUsersListState } from './use-users-list-state'
import styles from './users-list.module.scss'
import { UsersSummary } from './users-summary'

// One line of text as tall as the real one: `className` brings the text's
// font, so the line box is the same height, and the bar sits in it.
function Line({ className, width }: { className?: string; width: string }) {
  return (
    <span
      className={cx(className, styles.skeletonLine)}
      style={{ inlineSize: width }}
    >
      <Skeleton width="100%" />
    </span>
  )
}

// A user card before its data, part for part: the avatar, the name and the
// username, the roles row, and the state badge and join date
// at the foot.
function CardSkeleton() {
  return (
    <Card as="li" className={styles.account} aria-hidden="true">
      <div className={styles.accountHeader}>
        <div className={styles.identity}>
          <Skeleton shape="rect" className={styles.avatarSkeleton} />
          <span className={cx(styles.user, styles.userSkeleton)}>
            <Line className={styles.name} width="60%" />
            <Line className={styles.muted} width="45%" />
          </span>
        </div>
      </div>
      <div className={cx(styles.tags, styles.roles)}>
        <Line className={styles.muted} width="4rem" />
      </div>
      <div className={styles.meta}>
        <Skeleton className={styles.badgeSkeleton} />
        <Line className={styles.muted} width="8rem" />
      </div>
    </Card>
  )
}

// The grid of cards, one per user the page will hold, and the pager under it.
export function UsersGridSkeleton({
  count,
  label,
}: {
  count: number
  // The list's name, where the list stands in for the real one.
  label?: string
}) {
  return (
    <>
      <ul className={styles.grid} aria-busy="true" aria-label={label}>
        {Array.from({ length: count }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </ul>
      <div className={styles.pagerSkeleton} aria-hidden="true">
        <Line className={styles.muted} width="8.1rem" />
        <Skeleton className={styles.pagesSkeleton} />
        <Skeleton className={styles.pageSizeSkeleton} />
      </div>
    </>
  )
}

// The whole directory before its code and data arrive: the four counts, the
// search and role fields, and the grid. It uses the directory's own layout,
// so the columns change at the same widths and nothing moves when the page
// takes over.
export function UsersDirectorySkeleton() {
  const { filters, params } = useUsersListState()

  return (
    <div className={styles.root}>
      <UsersSummary state={filters.state} isPlaceholder />
      <div className={styles.toolbarSkeleton} aria-hidden="true">
        {[styles.searchSkeleton, styles.filterSkeleton].map((width) => (
          <div key={width} className={cx(styles.fieldSkeleton, width)}>
            <Line className={styles.labelSkeleton} width="4rem" />
            <Skeleton shape="rect" className={styles.controlSkeleton} />
          </div>
        ))}
      </div>
      <UsersGridSkeleton count={params.pageSize} />
    </div>
  )
}
