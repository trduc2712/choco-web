import { useId, useState } from 'react'
import { NavLink, useLocation } from 'react-router'

import type { BadgeShape } from '@/components/badge/badge'
import { Badge } from '@/components/badge/badge'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Tooltip } from '@/components/tooltip/tooltip'
import { cx } from '@/lib/cx'

export type NavListItem = {
  id: string
  label: string
  to?: string
  icon?: IconName
  count?: number
  // The largest count shown as is; above it the badge reads "max+". Defaults
  // to Badge's own cap.
  countMax?: number
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
      {item.icon && (
        <Icon className="nav-list-icon" name={item.icon} size="sm" />
      )}
      <span className="nav-list-label">{item.label}</span>
      {item.count !== undefined && !isCollapsed && (
        <Badge
          className="nav-list-count"
          count={item.count}
          max={item.countMax}
          tone="primary"
          variant="solid"
          size="sm"
          shape={badgeShape}
        />
      )}
      {item.count !== undefined && isCollapsed && (
        <span className="nav-list-dot" aria-hidden="true" />
      )}
    </>
  )

  if (item.items && !isCollapsed) {
    return (
      <li>
        <button
          className="nav-list-link"
          type="button"
          aria-expanded={isExpanded}
          aria-controls={id}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {content}
          <Icon
            className={cx(
              'nav-list-chevron',
              isExpanded && 'nav-list-expanded',
            )}
            name="chevron-right"
            size="sm"
          />
        </button>
        <ul id={id} className="nav-list-children" hidden={!isExpanded}>
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

  // Collapsed, only the icon shows: the name and the count are in a tooltip, and
  // the link's own name carries them for assistive technology.
  const summary =
    item.count === undefined ? item.label : `${item.label} \u00b7 ${item.count}`
  const link = (
    <NavLink
      className="nav-list-link"
      to={item.to ?? item.items?.[0]?.to ?? '#'}
      end={item.isEnd}
      aria-label={isCollapsed ? summary : undefined}
    >
      {content}
    </NavLink>
  )

  return (
    <li>
      {isCollapsed ? (
        <Tooltip content={summary} placement="right" className="nav-list-tip">
          {link}
        </Tooltip>
      ) : (
        link
      )}
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
      className={cx(
        'nav-list-root',
        isCollapsed && 'nav-list-collapsed',
        className,
      )}
      aria-label={label}
    >
      {sections.map((section) => {
        const titleId = `${id}-${section.id}`

        return (
          <div key={section.id} className="nav-list-section">
            {section.title && !isCollapsed && (
              <h2 id={titleId} className="nav-list-title">
                {section.title}
              </h2>
            )}
            <ul
              className="nav-list-list"
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
