import { useLayoutEffect, useRef, useState } from 'react'
import type { To } from 'react-router'
import { NavLink, useLocation } from 'react-router'

import type { BadgeShape } from '@/components/badge/badge'
import { Badge } from '@/components/badge/badge'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './tab-nav.module.scss'

export type TabNavItem = {
  id: string
  label: string
  to: To
  icon?: IconName
  count?: number
  isEnd?: boolean
}

export type TabNavProps = {
  label: string
  items: TabNavItem[]
  badgeShape?: BadgeShape
  className?: string
}

type Edges = { start: boolean; end: boolean }

// Whether there are links hidden past each end of the row.
function readEdges(list: HTMLElement): Edges {
  const { scrollLeft, clientWidth, scrollWidth } = list

  return {
    start: scrollLeft > 1,
    end: scrollLeft + clientWidth < scrollWidth - 1,
  }
}

// Brings the current page's link into view when it is cut off, centered so the
// links on both sides of it show too.
function revealCurrent(list: HTMLElement) {
  const link = list.querySelector<HTMLElement>('[aria-current="page"]')

  if (!link) {
    return
  }

  const box = list.getBoundingClientRect()
  const linkBox = link.getBoundingClientRect()

  if (linkBox.left < box.left || linkBox.right > box.right) {
    list.scrollLeft +=
      linkBox.left + linkBox.width / 2 - (box.left + box.width / 2)
  }
}

// A horizontal row of page links that look like line tabs. Each link goes to a
// route, so the current one is marked with aria-current rather than selected.
// It fills the height of its row, so inside Header the underline sits on the
// header's bottom border. Links that do not fit scroll sideways; a fade marks
// each end that has more links past it, and the current link is scrolled into
// view.
export function TabNav({
  label,
  items,
  badgeShape = 'round',
  className,
}: TabNavProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const { pathname } = useLocation()
  const [edges, setEdges] = useState<Edges>({ start: false, end: false })

  // Keeps the same state object while neither end changes, so scrolling within
  // the row does not re-render it.
  function updateEdges(list: HTMLElement) {
    const next = readEdges(list)

    setEdges((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    )
  }

  useLayoutEffect(() => {
    const list = listRef.current

    if (!list) {
      return
    }

    const update = () => updateEdges(list)
    update()

    if (typeof ResizeObserver !== 'function') {
      return
    }

    const observer = new ResizeObserver(update)
    observer.observe(list)

    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    const list = listRef.current

    if (list) {
      revealCurrent(list)
      updateEdges(list)
    }
  }, [pathname, items])

  return (
    <nav
      className={cx(
        styles.root,
        edges.start && styles.atStart,
        edges.end && styles.atEnd,
        className,
      )}
      aria-label={label}
    >
      <ul
        ref={listRef}
        className={styles.list}
        onScroll={(event) => updateEdges(event.currentTarget)}
      >
        {items.map((item) => (
          <li key={item.id} className={styles.item}>
            <NavLink className={styles.link} to={item.to} end={item.isEnd}>
              {item.icon && (
                <Icon className={styles.icon} name={item.icon} size="sm" />
              )}
              <span>{item.label}</span>
              {item.count !== undefined && (
                <Badge
                  className={styles.count}
                  count={item.count}
                  tone="neutral"
                  variant="subtle"
                  size="sm"
                  shape={badgeShape}
                />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
