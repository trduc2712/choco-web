import type { MouseEvent, ReactNode } from 'react'
import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Checkbox } from '@/components/checkbox/checkbox'
import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Menu } from '@/components/menu/menu'
import { Popover } from '@/components/popover/popover'
import { SearchInput } from '@/components/search-input/search-input'
import { Skeleton } from '@/components/skeleton/skeleton'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './table.module.scss'

export type TableAlign = 'start' | 'center' | 'end'
export type TableDensity = 'compact' | 'default' | 'comfortable'
export type TableSortDirection = 'ascending' | 'descending'

export type TableSort = {
  columnId: string
  direction: TableSortDirection
}

export type TableFilterOption = {
  value: string
  label: string
  icon?: IconName
}

// A menu in the column header that narrows the rows by one of the options. The
// table does not filter anything itself: it shows the menu and reports the
// choice, and the owner of the rows applies it (often by asking the server).
export type TableColumnFilter = {
  // Names the menu for assistive technology, such as "Filter by status".
  label: string
  options: TableFilterOption[]
  // The chosen option; undefined means no filter.
  value?: string
  onChange: (value: string | undefined) => void
}

// A search box in the column header, opened from a button there, with Search
// and Reset buttons under it, like the column search of Ant Design. The table
// does not search anything itself: it reports the words and the owner of the
// rows applies them (often by asking the server).
export type TableColumnSearch = {
  // Names the button and the box, such as "Search messages".
  label: string
  placeholder?: string
  // The search in force. Setting it from outside, to clear it for example,
  // also sets the box.
  value: string
  // Called with the words when the person presses Search or Enter, and with an
  // empty string when they press Reset.
  onChange: (value: string) => void
}

export type TableColumn<Row> = {
  id: string
  header: string
  cell: (row: Row) => ReactNode
  sortValue?: (row: Row) => string | number
  align?: TableAlign
  width?: string
  isRowHeader?: boolean
  filter?: TableColumnFilter
  search?: TableColumnSearch
}

// The group a row belongs to. Rows with the same id form one group, in the
// order the group first appears; its label heads the group's rows.
export type TableRowGroup = {
  id: string
  label: ReactNode
}

export type TableProps<Row> = {
  caption: string
  columns: TableColumn<Row>[]
  rows: Row[]
  getRowId: (row: Row) => string
  // Splits the rows into labelled groups, such as entries by day. Sorting by a
  // column orders the rows within each group and keeps the groups in place.
  getRowGroup?: (row: Row) => TableRowGroup
  // The detail shown under a row once it is expanded. A disclosure button in
  // a last column opens it, and so does a click anywhere on the row outside a
  // link or a control.
  renderExpanded?: (row: Row) => ReactNode
  expandedIds?: string[]
  defaultExpandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  isCaptionHidden?: boolean
  sort?: TableSort | null
  defaultSort?: TableSort | null
  onSortChange?: (sort: TableSort | null) => void
  isSelectable?: boolean
  selectedIds?: string[]
  defaultSelectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
  getRowLabel?: (row: Row) => string
  density?: TableDensity
  isStriped?: boolean
  isStickyHeader?: boolean
  isLoading?: boolean
  loadingRows?: number
  emptyState?: ReactNode
  className?: string
}

function ColumnFilter({ filter }: { filter: TableColumnFilter }) {
  const { t } = useTranslation()

  return (
    <Menu
      className={styles.filter}
      label={filter.label}
      icon="list-filter"
      isLabelHidden
      variant={filter.value === undefined ? 'ghost' : 'subtle'}
      size="sm"
      placement="bottom-start"
      items={[
        {
          id: 'all',
          label: t('table.filterAll'),
          isChecked: filter.value === undefined,
          onSelect: () => filter.onChange(undefined),
        },
        ...filter.options.map((option) => ({
          id: option.value,
          label: option.label,
          icon: option.icon,
          isChecked: filter.value === option.value,
          onSelect: () => filter.onChange(option.value),
        })),
      ]}
    />
  )
}

function ColumnSearch({ search }: { search: TableColumnSearch }) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  // What is typed, until Search is pressed.
  const [draft, setDraft] = useState(search.value)

  function apply(value: string) {
    search.onChange(value)
    setIsOpen(false)
  }

  return (
    <Popover
      className={styles.searchPanel}
      label={search.label}
      placement="bottom-start"
      isOpen={isOpen}
      onOpenChange={(open) => {
        // The box opens on the search in force, not on a half-typed one.
        if (open) setDraft(search.value)
        setIsOpen(open)
      }}
      trigger={
        <Button
          className={styles.filter}
          icon="search"
          variant={search.value === '' ? 'ghost' : 'subtle'}
          size="sm"
          aria-label={search.label}
        />
      }
    >
      <SearchInput
        label={search.label}
        isLabelHidden
        placeholder={search.placeholder}
        value={draft}
        onChange={setDraft}
        onSearch={apply}
      />
      <div className={styles.searchActions}>
        <Button iconStart="search" size="sm" onClick={() => apply(draft)}>
          {t('table.searchApply')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setDraft('')
            apply('')
          }}
        >
          {t('table.searchReset')}
        </Button>
      </div>
    </Popover>
  )
}

function compare(first: string | number, second: string | number) {
  return typeof first === 'number' && typeof second === 'number'
    ? first - second
    : String(first).localeCompare(String(second), undefined, { numeric: true })
}

type RowGroup<Row> = TableRowGroup & { rows: Row[] }

// Rows by group, in the order each group first appears.
function groupRows<Row>(
  rows: Row[],
  getRowGroup: (row: Row) => TableRowGroup,
): RowGroup<Row>[] {
  const groups = new Map<string, RowGroup<Row>>()

  for (const row of rows) {
    const group = getRowGroup(row)
    const entry = groups.get(group.id)

    if (entry) {
      entry.rows.push(row)
    } else {
      groups.set(group.id, { ...group, rows: [row] })
    }
  }

  return [...groups.values()]
}

// A click on a link or a control inside a row does its own thing, not expand.
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="button"]'

function nextSort(
  current: TableSort | null,
  columnId: string,
): TableSort | null {
  if (current?.columnId !== columnId) {
    return { columnId, direction: 'ascending' }
  }

  return current.direction === 'ascending'
    ? { columnId, direction: 'descending' }
    : null
}

export function Table<Row>({
  caption,
  columns,
  rows,
  getRowId,
  getRowGroup,
  renderExpanded,
  expandedIds: expandedIdsProp,
  defaultExpandedIds = [],
  onExpandedChange,
  isCaptionHidden = false,
  sort: sortProp,
  defaultSort = null,
  onSortChange,
  isSelectable = false,
  selectedIds: selectedIdsProp,
  defaultSelectedIds = [],
  onSelectionChange,
  getRowLabel,
  density = 'default',
  isStriped = false,
  isStickyHeader = false,
  isLoading = false,
  loadingRows = 3,
  emptyState,
  className,
}: TableProps<Row>) {
  const { t } = useTranslation()
  const captionId = useId()
  const [sort, setSort] = useControllableState({
    value: sortProp,
    defaultValue: defaultSort,
    onChange: onSortChange,
  })
  const [selectedIds, setSelectedIds] = useControllableState({
    value: selectedIdsProp,
    defaultValue: defaultSelectedIds,
    onChange: onSelectionChange,
  })

  const [expandedIds, setExpandedIds] = useControllableState({
    value: expandedIdsProp,
    defaultValue: defaultExpandedIds,
    onChange: onExpandedChange,
  })
  const baseId = useId()

  const sortColumn = columns.find((column) => column.id === sort?.columnId)
  const sortValue = sortColumn?.sortValue
  // Rows are sorted here only when the parent leaves sorting to the table.
  function sortRows(list: Row[]) {
    return sortValue && sortProp === undefined
      ? [...list].sort(
          (first, second) =>
            compare(sortValue(first), sortValue(second)) *
            (sort?.direction === 'descending' ? -1 : 1),
        )
      : list
  }
  // Grouped rows are sorted within their group; the groups keep their order.
  const groups: RowGroup<Row>[] | undefined = getRowGroup
    ? groupRows(rows, getRowGroup).map((group) => ({
        ...group,
        rows: sortRows(group.rows),
      }))
    : undefined
  const visibleRows = groups
    ? groups.flatMap((group) => group.rows)
    : sortRows(rows)

  const rowIds = visibleRows.map(getRowId)
  const selected = new Set(selectedIds)
  const expanded = new Set(expandedIds)
  const selectedCount = rowIds.filter((id) => selected.has(id)).length
  const isAllSelected = rowIds.length > 0 && selectedCount === rowIds.length
  const columnCount =
    columns.length + (isSelectable ? 1 : 0) + (renderExpanded ? 1 : 0)

  function toggleAll() {
    setSelectedIds(
      isAllSelected
        ? selectedIds.filter((id) => !rowIds.includes(id))
        : [...new Set([...selectedIds, ...rowIds])],
    )
  }

  function toggleRow(id: string) {
    setSelectedIds(
      selected.has(id)
        ? selectedIds.filter((selectedId) => selectedId !== id)
        : [...selectedIds, id],
    )
  }

  function toggleExpanded(id: string) {
    setExpandedIds(
      expanded.has(id)
        ? expandedIds.filter((expandedId) => expandedId !== id)
        : [...expandedIds, id],
    )
  }

  // A click on the row itself expands it; one on a link or a control inside it
  // does not.
  function handleRowClick(event: MouseEvent<HTMLTableRowElement>, id: string) {
    const target = event.target as Element
    const control = target.closest(INTERACTIVE)

    if (control && event.currentTarget.contains(control)) {
      return
    }

    toggleExpanded(id)
  }

  function renderRow(row: Row) {
    const id = getRowId(row)
    const isSelected = selected.has(id)
    const isExpanded = expanded.has(id)
    const detailId = `${baseId}-detail-${id}`
    const rowLabel = getRowLabel?.(row) ?? id

    return [
      <tr
        key={id}
        className={cx(
          isSelected && styles.selected,
          renderExpanded && styles.expandable,
          isExpanded && styles.open,
        )}
        aria-selected={isSelectable ? isSelected : undefined}
        onClick={
          renderExpanded ? (event) => handleRowClick(event, id) : undefined
        }
      >
        {isSelectable && (
          <td className={styles.select}>
            <Checkbox
              label={getRowLabel?.(row) ?? t('table.selectRow', { id })}
              isLabelHidden
              checked={isSelected}
              onChange={() => toggleRow(id)}
            />
          </td>
        )}
        {columns.map((column) => {
          const Cell = column.isRowHeader ? 'th' : 'td'

          return (
            <Cell
              key={column.id}
              className={styles[column.align ?? 'start']}
              scope={column.isRowHeader ? 'row' : undefined}
            >
              {column.cell(row)}
            </Cell>
          )
        })}
        {renderExpanded && (
          <td className={styles.expand}>
            <Button
              icon={isExpanded ? 'chevron-up' : 'chevron-down'}
              variant="ghost"
              size="sm"
              aria-label={t('table.rowDetails', { row: rowLabel })}
              aria-expanded={isExpanded}
              aria-controls={isExpanded ? detailId : undefined}
              onClick={() => toggleExpanded(id)}
            />
          </td>
        )}
      </tr>,
      renderExpanded && isExpanded ? (
        <tr key={`${id}-detail`} id={detailId} className={styles.detail}>
          <td colSpan={columnCount}>{renderExpanded(row)}</td>
        </tr>
      ) : null,
    ]
  }

  return (
    <div
      className={cx(styles.root, isStickyHeader && styles.sticky, className)}
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
    >
      <table
        className={cx(
          styles.table,
          styles[density],
          isStriped && styles.striped,
        )}
        aria-busy={isLoading || undefined}
      >
        <caption
          id={captionId}
          className={cx(styles.caption, isCaptionHidden && styles.hidden)}
        >
          {caption}
        </caption>
        <thead>
          <tr>
            {isSelectable && (
              <th className={styles.select} scope="col">
                <Checkbox
                  label={t('table.selectAll')}
                  isLabelHidden
                  checked={isAllSelected}
                  isIndeterminate={selectedCount > 0 && !isAllSelected}
                  disabled={isLoading || rowIds.length === 0}
                  onChange={toggleAll}
                />
              </th>
            )}
            {columns.map((column) => {
              const direction =
                sort?.columnId === column.id ? sort.direction : undefined
              const heading = column.sortValue ? (
                <button
                  className={styles.sort}
                  type="button"
                  onClick={() => setSort(nextSort(sort, column.id))}
                >
                  {column.header}
                  <Icon
                    className={cx(styles.sortIcon, direction && styles.sorted)}
                    name={
                      direction === 'ascending'
                        ? 'chevron-up'
                        : direction === 'descending'
                          ? 'chevron-down'
                          : 'chevron-up-down'
                    }
                    size="sm"
                  />
                </button>
              ) : (
                column.header
              )

              return (
                <th
                  key={column.id}
                  className={styles[column.align ?? 'start']}
                  scope="col"
                  style={{ width: column.width }}
                  aria-sort={
                    direction ?? (column.sortValue ? 'none' : undefined)
                  }
                >
                  {column.filter || column.search ? (
                    <span className={styles.head}>
                      {heading}
                      {column.search ? (
                        <ColumnSearch search={column.search} />
                      ) : null}
                      {column.filter ? (
                        <ColumnFilter filter={column.filter} />
                      ) : null}
                    </span>
                  ) : (
                    heading
                  )}
                </th>
              )
            })}
            {renderExpanded && (
              <th className={styles.expand} scope="col">
                <VisuallyHidden>{t('table.details')}</VisuallyHidden>
              </th>
            )}
          </tr>
        </thead>
        {groups && !isLoading
          ? groups.map((group) => (
              <tbody key={group.id}>
                <tr className={styles.group}>
                  <th scope="rowgroup" colSpan={columnCount}>
                    {group.label}
                  </th>
                </tr>
                {group.rows.map(renderRow)}
              </tbody>
            ))
          : null}
        {/* Grouped rows have their own bodies; this one holds ungrouped rows,
            the loading rows and the empty state. */}
        {(!groups || isLoading || visibleRows.length === 0) && (
          <tbody>
            {isLoading &&
              Array.from({ length: loadingRows }, (_, index) => (
                <tr key={index}>
                  {Array.from({ length: columnCount }, (_, cellIndex) => (
                    <td key={cellIndex}>
                      <Skeleton
                        width={
                          cellIndex === 0 && isSelectable
                            ? 'var(--size-toggle)'
                            : '70%'
                        }
                      />
                    </td>
                  ))}
                </tr>
              ))}
            {!isLoading && !groups && visibleRows.map(renderRow)}
            {!isLoading && visibleRows.length === 0 && emptyState && (
              <tr>
                <td className={styles.empty} colSpan={columnCount}>
                  {emptyState}
                </td>
              </tr>
            )}
          </tbody>
        )}
      </table>
    </div>
  )
}
