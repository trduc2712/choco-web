import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink, useLocation } from 'react-router'

import { Tooltip } from '@/components/tooltip/tooltip'
import type { SymbolName } from '@/lib/symbols'
import { symbols } from '@/lib/symbols'

export type NavListItem = {
  id: string
  label: string
  to?: string
  icon?: SymbolName
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
}

function NavItem({ item, isCollapsed }: NavItemProps) {
  const { t } = useTranslation()
  const id = useId()
  const { pathname } = useLocation()
  const [isExpanded, setIsExpanded] = useState(() =>
    containsPath(item, pathname),
  )
  const content = (
    <>
      {item.icon && <span aria-hidden="true">{symbols[item.icon]}</span>}
      <span>{item.label}</span>
      {item.count !== undefined && !isCollapsed && (
        <span>
          {item.count > (item.countMax ?? 99)
            ? t('badge.overflow', { max: item.countMax ?? 99 })
            : item.count}
        </span>
      )}
      {item.count !== undefined && isCollapsed && <span aria-hidden="true" />}
    </>
  )

  if (item.items && !isCollapsed) {
    return (
      <li>
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-controls={id}
          onClick={() => setIsExpanded((current) => !current)}
        >
          {content}
          <span aria-hidden="true">›</span>
        </button>
        <ul id={id} hidden={!isExpanded}>
          {item.items.map((child) => (
            <NavItem key={child.id} item={child} isCollapsed={isCollapsed} />
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
        <Tooltip content={summary} placement="right">
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
  className,
}: NavListProps) {
  const id = useId()

  return (
    <nav className={className} aria-label={label}>
      {sections.map((section) => {
        const titleId = `${id}-${section.id}`

        return (
          <div key={section.id}>
            {section.title && !isCollapsed && (
              <h2 id={titleId}>{section.title}</h2>
            )}
            <ul
              aria-labelledby={
                section.title && !isCollapsed ? titleId : undefined
              }
            >
              {section.items.map((item) => (
                <NavItem key={item.id} item={item} isCollapsed={isCollapsed} />
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
