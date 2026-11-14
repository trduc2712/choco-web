import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { TableColumn, TableDensity } from '@/components'
import {
  Badge,
  EmptyState,
  Highlight,
  SegmentedControl,
  Stack,
  Table,
  Text,
} from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

type Order = {
  id: string
  customer: string
  status: 'paid' | 'pending' | 'refunded'
  total: number
}

const ORDERS: Order[] = [
  { id: 'order-id-1', customer: 'Display Name 1', status: 'paid', total: 48 },
  {
    id: 'order-id-2',
    customer: 'Display Name 2',
    status: 'pending',
    total: 125.5,
  },
  {
    id: 'order-id-3',
    customer: 'Display Name 3',
    status: 'refunded',
    total: 19,
  },
  {
    id: 'order-id-4',
    customer: 'Display Name 4',
    status: 'paid',
    total: 72.25,
  },
]

const STATUS_TONES = {
  paid: 'success',
  pending: 'warning',
  refunded: 'neutral',
} as const
const DENSITIES: TableDensity[] = ['compact', 'default', 'comfortable']
export function TableEntry() {
  const { t, i18n } = useTranslation('designSystem')
  const currency = new Intl.NumberFormat(i18n.resolvedLanguage, {
    style: 'currency',
    currency: 'USD',
  })
  const [density, setDensity] = useState<TableDensity>('default')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [customerSearch, setCustomerSearch] = useState('')
  const statusLabels = {
    paid: t('samples.statusPaid'),
    pending: t('samples.statusPending'),
    refunded: t('samples.statusRefunded'),
  }
  const columns: TableColumn<Order>[] = [
    {
      id: 'id',
      header: t('samples.colOrder'),
      cell: (order) => order.id,
      sortValue: (order) => order.id,
      isRowHeader: true,
    },
    {
      id: 'customer',
      header: t('samples.colCustomer'),
      cell: (order) => order.customer,
      sortValue: (order) => order.customer,
    },
    {
      id: 'status',
      header: t('samples.colStatus'),
      cell: (order) => (
        <Badge tone={STATUS_TONES[order.status]}>
          {statusLabels[order.status]}
        </Badge>
      ),
    },
    {
      id: 'total',
      header: t('samples.colTotal'),
      cell: (order) => currency.format(order.total),
      sortValue: (order) => order.total,
      align: 'end',
    },
  ]
  const tableProps = {
    caption: t('samples.tableCaption'),
    columns,
    getRowId: (order: Order) => order.id,
  }

  return (
    <>
      <ShowcaseSection title={t('sections.sorting')}>
        <Specimen label="sortValue + isSelectable" isStretched>
          <Table
            {...tableProps}
            rows={ORDERS}
            defaultSort={{ columnId: 'id', direction: 'descending' }}
            getRowLabel={(order) => t('samples.selectOrder', { id: order.id })}
            isSelectable
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.columnFilter')}>
        <Specimen label="filter" isStretched>
          <Table
            {...tableProps}
            columns={columns.map((column) =>
              column.id === 'status'
                ? {
                    ...column,
                    filter: {
                      label: t('samples.filterStatus'),
                      value: statusFilter,
                      options: Object.entries(statusLabels).map(
                        ([value, label]) => ({ value, label }),
                      ),
                      onChange: setStatusFilter,
                    },
                  }
                : column,
            )}
            rows={ORDERS.filter(
              (order) => !statusFilter || order.status === statusFilter,
            )}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.columnSearch')}>
        <Specimen label="search" isStretched>
          <Table
            {...tableProps}
            columns={columns.map((column) =>
              column.id === 'customer'
                ? {
                    ...column,
                    cell: (order: Order) => (
                      <Highlight text={order.customer} query={customerSearch} />
                    ),
                    search: {
                      label: t('samples.searchCustomer'),
                      value: customerSearch,
                      onChange: setCustomerSearch,
                    },
                  }
                : column,
            )}
            rows={ORDERS.filter((order) =>
              order.customer
                .toLowerCase()
                .includes(customerSearch.trim().toLowerCase()),
            )}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.rowGroups')}>
        <Specimen label="getRowGroup" isStretched>
          <Table
            {...tableProps}
            rows={ORDERS}
            getRowGroup={(order) => ({
              id: order.status,
              label: statusLabels[order.status],
            })}
            defaultSort={{ columnId: 'total', direction: 'descending' }}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.expandableRows')}>
        <Specimen label="renderExpanded" isStretched>
          <Table
            {...tableProps}
            rows={ORDERS}
            getRowLabel={(order) => order.id}
            renderExpanded={(order) => (
              <Text size="sm">
                {order.customer} · {currency.format(order.total)}
              </Text>
            )}
            defaultExpandedIds={['order-id-2']}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.density')}>
        <Stack gap={3}>
          <SegmentedControl
            label={t('sections.density')}
            size="sm"
            value={density}
            onChange={(value) => setDensity(value as TableDensity)}
            options={DENSITIES.map((value) => ({ value, label: value }))}
          />
          <Table
            {...tableProps}
            rows={ORDERS}
            density={density}
            isStriped
            isCaptionHidden
          />
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.loading')}>
        <Specimen label="isLoading" isStretched>
          <Table {...tableProps} rows={[]} isLoading isCaptionHidden />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.noResults')}>
        <Specimen label="emptyState" isStretched>
          <Table
            {...tableProps}
            rows={[]}
            isCaptionHidden
            emptyState={
              <EmptyState
                size="sm"
                icon="inbox"
                title={t('samples.tableEmpty')}
                description={t('samples.tableEmptyDescription')}
                headingLevel={4}
              />
            }
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
