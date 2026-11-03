import { useState } from 'react'

import { Pagination } from '@/components'

const PAGE_COUNT = 12

export function PaginationUsage() {
  const [page, setPage] = useState(1)

  return (
    <Pagination page={page} pageCount={PAGE_COUNT} onPageChange={setPage} />
  )
}
