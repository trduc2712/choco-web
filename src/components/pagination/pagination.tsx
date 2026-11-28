import { useTranslation } from 'react-i18next'

import { getPageRange } from './get-page-range'

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
      <ul>
        <li>
          <button
            type="button"
            aria-label={t('pagination.previous')}
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            {t('pagination.previous')}
          </button>
        </li>
        {getPageRange(page, pageCount, siblingCount).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                aria-label={t('pagination.page', { page: item })}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true">
              <span aria-hidden="true">…</span>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label={t('pagination.next')}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            {t('pagination.next')}
          </button>
        </li>
      </ul>
    </nav>
  )
}
