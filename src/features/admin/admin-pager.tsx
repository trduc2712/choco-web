import { useTranslation } from 'react-i18next'

import { PageSizeSelect } from '@/components/page-size-select/page-size-select'
import { Pagination } from '@/components/pagination/pagination'
import { Text } from '@/components/text/text'
import { cx } from '@/lib/cx'
import { getPageCount } from '@/lib/page-response'

import styles from './admin-pager.module.scss'

type AdminPagerProps = {
  page: number
  pageSize: number
  totalCount: number
  // How many rows the page on screen has.
  itemCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  className?: string
}

// The foot of an admin table: which rows are on screen, the page buttons and
// the rows-per-page choice.
export function AdminPager({
  page,
  pageSize,
  totalCount,
  itemCount,
  onPageChange,
  onPageSizeChange,
  className,
}: AdminPagerProps) {
  const { t } = useTranslation()
  const pageCount = getPageCount(totalCount, pageSize)
  const from = (page - 1) * pageSize + 1
  const to = from + itemCount - 1

  return (
    <div className={cx(styles.root, className)}>
      <Text size="sm" tone="muted">
        {t('admin.pager.range', { from, to, total: totalCount })}
      </Text>
      <Pagination
        className={styles.pages}
        page={page}
        pageCount={pageCount}
        onPageChange={(next) => {
          onPageChange(next)
          window.scrollTo({ top: 0 })
        }}
      />
      <PageSizeSelect
        className={styles.size}
        value={pageSize}
        onChange={onPageSizeChange}
      />
    </div>
  )
}
