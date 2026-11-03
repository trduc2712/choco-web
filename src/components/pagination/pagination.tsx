import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Icon } from '@/components/icon/icon'
import { cx } from '@/lib/cx'

import { getPageRange } from './get-page-range'
import styles from './pagination.module.scss'

export type PaginationProps = {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  siblingCount?: number
  label?: string
  className?: string
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  siblingCount = 1,
  label,
  className,
}: PaginationProps) {
  const { t } = useTranslation()

  return (
    <nav className={className} aria-label={label ?? t('pagination.label')}>
      <ul className={styles.list}>
        <li>
          <Button
            icon="chevron-left"
            variant="ghost"
            aria-label={t('pagination.previous')}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          />
        </li>
        {getPageRange(page, pageCount, siblingCount).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <Button
                className={cx(styles.page)}
                variant={item === page ? 'subtle' : 'ghost'}
                aria-label={t('pagination.page', { page: item })}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            </li>
          ) : (
            <li key={item} className={styles.gap} aria-hidden="true">
              <Icon name="more-horizontal" size="sm" />
            </li>
          ),
        )}
        <li>
          <Button
            icon="chevron-right"
            variant="ghost"
            aria-label={t('pagination.next')}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          />
        </li>
      </ul>
    </nav>
  )
}
