import type { To } from 'react-router'
import { NavLink } from 'react-router'

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

// A horizontal row of page links that look like line tabs. Each link goes to a
// route, so the current one is marked with aria-current rather than selected.
// It fills the height of its row, so inside Header the underline sits on the
// header's bottom border.
export function TabNav({
  label,
  items,
  badgeShape = 'round',
  className,
}: TabNavProps) {
  return (
    <nav className={cx(styles.root, className)} aria-label={label}>
      <ul className={styles.list}>
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
