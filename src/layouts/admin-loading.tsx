import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

import { Header } from '@/components/header/header'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Skeleton } from '@/components/skeleton/skeleton'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import {
  ADMIN_SCREENS,
  ADMIN_SIDEBAR_COLLAPSED_KEY,
  useExpectedPageSize,
} from '@/features/admin'
import {
  UserDetailsSkeleton,
  UsersDirectorySkeleton,
} from '@/features/users-admin'
import { useMediaQuery } from '@/hooks/use-media-query'
import { useStoredBoolean } from '@/hooks/use-stored-boolean'
import { cx } from '@/lib/cx'

// The navigation as it is once loaded: a "Moderation" group of five links and
// a "System" group of two.
const NAV_GROUPS = [5, 2]

// A table as the feedback screen draws it, cell for cell: five columns of the
// widths the real table settles on (wider than the page, so it scrolls
// sideways like the real one), a header row, and one row per item on a page
// with a line of text, a username, two badges and a date. There are as many
// rows as the page size.
function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div>
      <div>
        <div className={cx('admin-loading-cols', 'admin-loading-head')}>
          {[0, 1, 2, 3, 4].map((column) => (
            <div key={column}>
              <Skeleton />
            </div>
          ))}
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div
            key={index}
            className={cx('admin-loading-cols', 'admin-loading-row')}
          >
            <div>
              <Skeleton />
            </div>
            <div>
              <Skeleton />
            </div>
            <div>
              <Skeleton
                className={cx('admin-loading-badge', 'admin-loading-category')}
              />
            </div>
            <div>
              <Skeleton
                className={cx('admin-loading-badge', 'admin-loading-status')}
              />
            </div>
            <div>
              <Skeleton />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// The pager under a table: the range of items, the page buttons, and the rows
// per page.
function PagerSkeleton() {
  return (
    <div>
      <Skeleton />
      <Skeleton />
      <Skeleton />
    </div>
  )
}

// The search boxes and filters above a table: a label over a 36px control,
// two wide and two narrow, as the feedback screen has them.
function ToolbarSkeleton() {
  return (
    <div>
      {[
        'admin-loading-field',
        'admin-loading-field',
        'admin-loading-select',
        'admin-loading-select',
      ].map((width, index) => (
        <div key={index} className={cx('admin-loading-control', width)}>
          <Skeleton width="4rem" />
          <Skeleton width="100%" height="var(--size-control-md)" />
        </div>
      ))}
    </div>
  )
}

// The screen's own wait: its title, its toolbar and its table, drawn as
// skeletons. The table's skeleton takes over from this one without the page
// changing.
export function AdminContentLoading() {
  const { t } = useTranslation()
  // As many rows as the table will have: the page size it opens with, which
  // is the one in the URL or the one this screen remembers.
  const { pathname } = useLocation()
  const screen = ADMIN_SCREENS.find(({ to }) => pathname.startsWith(to))
  const pageSize = useExpectedPageSize(
    screen ? `choco.admin.${screen.id}.pageSize` : undefined,
  )

  // A user's own page is a profile, not a list.
  if (screen?.id === 'users' && pathname.startsWith(`${screen.to}/`)) {
    return <UserDetailsSkeleton />
  }

  return (
    <div role="status">
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      <Skeleton width="var(--space-9)" />
      {/* The users directory is counts and a grid of cards, not a table. */}
      {screen?.id === 'users' && pathname === screen.to ? (
        <UsersDirectorySkeleton />
      ) : (
        <div>
          <ToolbarSkeleton />
          <TableSkeleton rows={pageSize} />
          <PagerSkeleton />
        </div>
      )}
    </div>
  )
}

// The wait for the viewer's permissions: the admin shell as it will look, with
// skeletons where the navigation, the bar's controls and the screen will be,
// so the one loading state is the page itself rather than a spinner that gives
// way to it.
export function AdminLoading() {
  const isNarrow = useMediaQuery('(width < 768px)')
  // The same state as the real sidebar will open in.
  const [isCollapsed] = useStoredBoolean(ADMIN_SIDEBAR_COLLAPSED_KEY, isNarrow)

  return (
    <div aria-busy="true">
      <Sidebar
        className={cx(
          'admin-layout-sidebar',
          isCollapsed && 'admin-layout-collapsed',
        )}
        label=""
      >
        {() => (
          <>
            <Skeleton
              width="var(--size-control-md)"
              height="var(--size-control-md)"
            />
            <div
              className={cx(
                'admin-loading-nav',
                isCollapsed && 'admin-loading-collapsedNav',
              )}
            >
              {NAV_GROUPS.map((links, group) => (
                <div key={group}>
                  {isCollapsed ? null : <Skeleton width="40%" />}
                  <div>
                    {Array.from({ length: links }, (_, index) => (
                      <Skeleton
                        key={index}
                        width="100%"
                        height="var(--size-control-md)"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Sidebar>
      <div>
        <Header>
          <div>
            <Skeleton
              shape="circle"
              width="var(--size-avatar-md)"
              height="var(--size-avatar-md)"
            />
            <Skeleton
              shape="circle"
              width="var(--size-avatar-md)"
              height="var(--size-avatar-md)"
            />
          </div>
        </Header>
        <main>
          <AdminContentLoading />
        </main>
      </div>
    </div>
  )
}
