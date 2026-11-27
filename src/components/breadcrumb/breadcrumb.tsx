import { useTranslation } from 'react-i18next'
import type { To } from 'react-router'

import { Icon } from '@/components/icon/icon'
import { Link } from '@/components/link/link'
import { cx } from '@/lib/cx'

export type BreadcrumbItem = {
  label: string
  to?: To
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  const { t } = useTranslation()

  return (
    <nav className={className} aria-label={t('breadcrumb.label')}>
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1

          return (
            <li key={item.label} className="breadcrumb-item">
              {index > 0 && (
                <Icon
                  className="breadcrumb-separator"
                  name="chevron-right"
                  size="sm"
                />
              )}
              {item.to !== undefined && !isCurrent ? (
                <Link to={item.to} variant="subtle">
                  {item.label}
                </Link>
              ) : (
                <span
                  className={cx(isCurrent && 'breadcrumb-current')}
                  aria-current={isCurrent ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
