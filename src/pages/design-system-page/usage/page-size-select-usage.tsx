import { useState } from 'react'

import { PageSizeSelect } from '@/components'

export function PageSizeSelectUsage() {
  const [pageSize, setPageSize] = useState(20)

  return <PageSizeSelect value={pageSize} onChange={setPageSize} />
}
