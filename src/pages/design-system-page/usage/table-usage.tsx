import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { TableColumn } from '@/components'
import { Table } from '@/components'

type Order = { id: string; customer: string; total: number }

const ORDERS: Order[] = [
  { id: 'order-id-1', customer: 'Display Name 1', total: 48 },
  { id: 'order-id-2', customer: 'Display Name 2', total: 125 },
]

export function TableUsage() {
  const { t } = useTranslation('designSystem')
  const [selected, setSelected] = useState<string[]>([])
  const columns: TableColumn<Order>[] = [
    {
      id: 'id',
      header: t('samples.colOrder'),
      cell: (order) => order.id,
      isRowHeader: true,
    },
    {
      id: 'total',
      header: t('samples.colTotal'),
      cell: (order) => `$${order.total}`,
      sortValue: (order) => order.total,
      align: 'end',
    },
  ]

  return (
    <Table
      caption={t('samples.tableCaption')}
      columns={columns}
      rows={ORDERS}
      getRowId={(order) => order.id}
      isSelectable
      selectedIds={selected}
      onSelectionChange={setSelected}
    />
  )
}
