import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { useControllableState } from '@/hooks/use-controllable-state'

export type SidebarRenderProps = {
  isCollapsed: boolean
}

export type SidebarProps = {
  label: string
  children: (props: SidebarRenderProps) => ReactNode
  header?: ReactNode
  footer?: ReactNode
  isCollapsible?: boolean
  isCollapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (isCollapsed: boolean) => void
  className?: string
}

export function Sidebar({
  label,
  children,
  header,
  footer,
  isCollapsible = false,
  isCollapsed: isCollapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  className,
}: SidebarProps) {
  const { t } = useTranslation()
  const [isCollapsed, setIsCollapsed] = useControllableState({
    value: isCollapsedProp,
    defaultValue: defaultCollapsed,
    onChange: onCollapsedChange,
  })
  const isShownCollapsed = isCollapsible && isCollapsed

  return (
    <aside className={className} aria-label={label}>
      {(header || isCollapsible) && (
        <div>
          {!isShownCollapsed && header}
          {isCollapsible && (
            <button
              type="button"
              aria-label={
                isShownCollapsed ? t('sidebar.expand') : t('sidebar.collapse')
              }
              aria-expanded={!isShownCollapsed}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isShownCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
            </button>
          )}
        </div>
      )}
      <div>{children({ isCollapsed: isShownCollapsed })}</div>
      {footer && <div>{footer}</div>}
    </aside>
  )
}
