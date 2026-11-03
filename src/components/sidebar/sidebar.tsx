import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './sidebar.module.scss'

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
    <aside
      className={cx(
        styles.root,
        isShownCollapsed && styles.collapsed,
        className,
      )}
      aria-label={label}
    >
      {(header || isCollapsible) && (
        <div className={styles.header}>
          {!isShownCollapsed && header}
          {isCollapsible && (
            <Button
              className={styles.toggle}
              icon={isShownCollapsed ? 'panel-right' : 'panel-left'}
              variant="ghost"
              size="sm"
              aria-label={
                isShownCollapsed ? t('sidebar.expand') : t('sidebar.collapse')
              }
              aria-expanded={!isShownCollapsed}
              onClick={() => setIsCollapsed(!isCollapsed)}
            />
          )}
        </div>
      )}
      <div className={styles.body}>
        {children({ isCollapsed: isShownCollapsed })}
      </div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </aside>
  )
}
