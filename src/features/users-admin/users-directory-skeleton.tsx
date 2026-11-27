import { Card } from '@/components/card/card'
import { Skeleton } from '@/components/skeleton/skeleton'
import { cx } from '@/lib/cx'

import { useUsersListState } from './use-users-list-state'
import { UsersSummary } from './users-summary'

// One line of text as tall as the real one: `className` brings the text's
// font, so the line box is the same height, and the bar sits in it.
function Line({ className, width }: { className?: string; width: string }) {
  return (
    <span
      className={cx(className, 'users-list-skeletonLine')}
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
    <Card as="li" aria-hidden="true">
      <div>
        <div>
          <Skeleton shape="rect" />
          <span className={cx('users-list-user', 'users-list-userSkeleton')}>
            <Line width="60%" />
            <Line width="45%" />
          </span>
        </div>
      </div>
      <div className={cx('users-list-tags', 'users-list-roles')}>
        <Line width="4rem" />
      </div>
      <div>
        <Skeleton />
        <Line width="8rem" />
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
      <ul aria-busy="true" aria-label={label}>
        {Array.from({ length: count }, (_, index) => (
          <CardSkeleton key={index} />
        ))}
      </ul>
      <div aria-hidden="true">
        <Line width="8.1rem" />
        <Skeleton />
        <Skeleton />
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
    <div>
      <UsersSummary state={filters.state} isPlaceholder />
      <div aria-hidden="true">
        {['users-list-searchSkeleton', 'users-list-filterSkeleton'].map(
          (width) => (
            <div key={width} className={cx('users-list-fieldSkeleton', width)}>
              <Line width="4rem" />
              <Skeleton shape="rect" />
            </div>
          ),
        )}
      </div>
      <UsersGridSkeleton count={params.pageSize} />
    </div>
  )
}
