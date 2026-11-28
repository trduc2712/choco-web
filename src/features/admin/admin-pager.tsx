import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { PageSizeSelect } from '@/components/page-size-select/page-size-select'
import { Pagination } from '@/components/pagination/pagination'
import { cx } from '@/lib/cx'
import { getPageCount } from '@/lib/page-response'

type AdminPagerProps = {
  page: number
  pageSize: number
  totalCount: number
  // How many rows the page on screen has.
  itemCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  // The sizes to offer, when the list has its own.
  pageSizes?: readonly number[]
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
  pageSizes,
  className,
}: AdminPagerProps) {
  const { t } = useTranslation()
  const pagerRef = useRef<HTMLDivElement>(null)
  const pageCount = getPageCount(totalCount, pageSize)
  const from = (page - 1) * pageSize + 1
  const to = from + itemCount - 1

  return (
    <div ref={pagerRef} className={cx('admin-pager-root', className)}>
      <p>{t('admin.pager.range', { from, to, total: totalCount })}</p>
      <Pagination
        page={page}
        pageCount={pageCount}
        onPageChange={(next) => {
          onPageChange(next)
          const main = pagerRef.current?.closest('main')
          if (main) main.scrollTop = 0
          window.scrollTo({ top: 0 })
        }}
      />
      <PageSizeSelect
        value={pageSize}
        options={pageSizes}
        onChange={onPageSizeChange}
      />
    </div>
  )
}
