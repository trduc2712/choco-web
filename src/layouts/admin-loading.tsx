import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

import { Header } from '@/components/header/header'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Skeleton } from '@/components/skeleton/skeleton'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { ADMIN_SCREENS, useExpectedPageSize } from '@/features/admin'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cx } from '@/lib/cx'

import layout from './admin-layout.module.scss'
import styles from './admin-loading.module.scss'

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
    <div className={styles.table}>
      <div className={styles.sheet}>
        <div className={cx(styles.cols, styles.head)}>
          {[0, 1, 2, 3, 4].map((column) => (
            <div key={column} className={styles.cell}>
              <Skeleton className={styles.headText} />
            </div>
          ))}
        </div>
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className={cx(styles.cols, styles.row)}>
            <div className={styles.cell}>
              <Skeleton className={styles.message} />
            </div>
            <div className={styles.cell}>
              <Skeleton className={styles.username} />
            </div>
            <div className={styles.cell}>
              <Skeleton className={cx(styles.badge, styles.category)} />
            </div>
            <div className={styles.cell}>
              <Skeleton className={cx(styles.badge, styles.status)} />
            </div>
            <div className={styles.cell}>
              <Skeleton className={styles.date} />
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
    <div className={styles.pager}>
      <Skeleton className={styles.range} />
      <Skeleton className={styles.pages} />
      <Skeleton className={styles.size} />
    </div>
  )
}

// The search boxes and filters above a table: a label over a 36px control,
// two wide and two narrow, as the feedback screen has them.
function ToolbarSkeleton() {
  return (
    <div className={styles.toolbar}>
      {[styles.field, styles.field, styles.select, styles.select].map(
        (width, index) => (
          <div key={index} className={cx(styles.control, width)}>
            <Skeleton width="4rem" className={styles.label} />
            <Skeleton width="100%" height="var(--size-control-md)" />
          </div>
        ),
      )}
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

  return (
    <div role="status" className={styles.content}>
      <VisuallyHidden>{t('common.loading')}</VisuallyHidden>
      <Skeleton width="var(--space-9)" className={styles.title} />
      <div className={styles.body}>
        <ToolbarSkeleton />
        <TableSkeleton rows={pageSize} />
        <PagerSkeleton />
      </div>
    </div>
  )
}

// The wait for the viewer's permissions: the admin shell as it will look, with
// skeletons where the navigation, the bar's controls and the screen will be,
// so the one loading state is the page itself rather than a spinner that gives
// way to it.
export function AdminLoading() {
  const isNarrow = useMediaQuery('(width < 768px)')

  return (
    <div className={layout.layout} aria-busy="true">
      <Sidebar
        className={cx(layout.sidebar, isNarrow && layout.collapsed)}
        label=""
      >
        {() => (
          <div className={styles.nav}>
            {NAV_GROUPS.map((links, group) => (
              <div key={group} className={styles.group}>
                {isNarrow ? null : (
                  <Skeleton width="40%" className={styles.groupTitle} />
                )}
                <div className={styles.links}>
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
        )}
      </Sidebar>
      <div className={layout.content}>
        <Header className={layout.header}>
          <Skeleton
            width="var(--size-control-sm)"
            height="var(--size-control-sm)"
            className={styles.toggle}
          />
          <div className={styles.actions}>
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
        <main className={layout.main}>
          <AdminContentLoading />
        </main>
      </div>
    </div>
  )
}
