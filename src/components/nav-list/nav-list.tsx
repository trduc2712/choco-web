import { useId, useState } from 'react'
import { NavLink, useLocation } from 'react-router'

import type { BadgeShape } from '@/components/badge/badge'
import { Badge } from '@/components/badge/badge'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

import styles from './nav-list.module.scss'

export type NavListItem = {
  id: string
  label: string
  to?: string
  icon?: IconName
  count?: number
  isEnd?: boolean
  items?: NavListItem[]
}

export type NavListSection = {
  id: string
  title?: string
  items: NavListItem[]
}

export type NavListProps = {
  label: string
  sections: NavListSection[]
  isCollapsed?: boolean
  badgeShape?: BadgeShape
  className?: string
}

function containsPath(item: NavListItem, pathname: string): boolean {
  return (
    (item.to !== undefined && pathname.startsWith(item.to)) ||
    (item.items ?? []).some((child) => containsPath(child, pathname))
  )
}

type NavItemProps = {
  item: NavListItem
  isCollapsed: boolean
  badgeShape: BadgeShape
}

function NavItem({ item, isCollapsed, badgeShape }: NavItemProps) {
  const id = useId()
  const { pathname } = useLocation()
  const [isExpanded, setIsExpanded] = useState(() =>
    containsPath(item, pathname),
  )
  const content = (
    <>
      {item.icon && <Icon className={styles.icon} name={item.icon} size="sm" />}
      <span className={styles.label}>{item.label}</span>
      {item.count !== undefined && !isCollapsed && (
        <Badge
          className={styles.count}
          count={item.count}
          tone="primary"
          variant="solid"
          size="sm"
          shape={badgeShape}
        />
      )}
    </>
  )

  if (item.items && !isCollapsed) {
    return (
      <li>
        <button
          className={styles.link}
          type="button"
          aria-expanded={isExpanded}
          aria-controls={id}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {content}
          <Icon
            className={cx(styles.chevron, isExpanded && styles.expanded)}
            name="chevron-right"
            size="sm"
          />
        </button>
        <ul id={id} className={styles.children} hidden={!isExpanded}>
          {item.items.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
              badgeShape={badgeShape}
            />
          ))}
        </ul>
      </li>
    )
  }

  return (
    <li>
      <NavLink
        className={styles.link}
        to={item.to ?? item.items?.[0]?.to ?? '#'}
        end={item.isEnd}
        aria-label={isCollapsed ? item.label : undefined}
        title={isCollapsed ? item.label : undefined}
      >
        {content}
      </NavLink>
    </li>
  )
}

export function NavList({
  label,
  sections,
  isCollapsed = false,
  badgeShape = 'round',
  className,
}: NavListProps) {
  const id = useId()

  return (
    <nav
      className={cx(styles.root, isCollapsed && styles.collapsed, className)}
      aria-label={label}
    >
      {sections.map((section) => {
        const titleId = `${id}-${section.id}`

        return (
          <div key={section.id} className={styles.section}>
            {section.title && !isCollapsed && (
              <h2 id={titleId} className={styles.title}>
                {section.title}
              </h2>
            )}
            <ul
              className={styles.list}
              aria-labelledby={
                section.title && !isCollapsed ? titleId : undefined
              }
            >
              {section.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isCollapsed={isCollapsed}
                  badgeShape={badgeShape}
                />
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
