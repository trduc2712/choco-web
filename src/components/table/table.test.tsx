import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { TableColumn } from '@/components/table/table'
import { Table } from '@/components/table/table'
import styles from '@/components/table/table.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

type Person = { id: string; name: string; age: number }

const PEOPLE: Person[] = [
  { id: 'b', name: 'Name B', age: 31 },
  { id: 'a', name: 'Name A', age: 24 },
  { id: 'c', name: 'Name C', age: 45 },
]

const COLUMNS: TableColumn<Person>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: (person) => person.name,
    sortValue: (person) => person.name,
    isRowHeader: true,
  },
  {
    id: 'age',
    header: 'Age',
    cell: (person) => person.age,
    sortValue: (person) => person.age,
    align: 'end',
  },
]

function getNames() {
  return screen.getAllByRole('rowheader').map((cell) => cell.textContent)
}

test('renders a captioned table with row headers', async () => {
  const { container } = render(
    <Table
      caption="People"
      columns={COLUMNS}
      rows={PEOPLE}
      getRowId={(person) => person.id}
    />,
  )

  expect(screen.getByRole('table', { name: 'People' })).toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'People' })).toHaveAttribute(
    'tabindex',
    '0',
  )
  expect(getNames()).toEqual(['Name B', 'Name A', 'Name C'])
  expectStyle(screen.getByRole('columnheader', { name: 'Age' }), styles, 'end')
  await expectNoA11yViolations(container)
})

test('cycles a column through ascending, descending and unsorted', async () => {
  render(
    <Table
      caption="People"
      columns={COLUMNS}
      rows={PEOPLE}
      getRowId={(person) => person.id}
    />,
  )
  const header = screen.getByRole('columnheader', { name: 'Age' })
  const button = within(header).getByRole('button', { name: 'Age' })

  expect(header).toHaveAttribute('aria-sort', 'none')

  await userEvent.click(button)

  expect(header).toHaveAttribute('aria-sort', 'ascending')
  expect(getNames()).toEqual(['Name A', 'Name B', 'Name C'])

  await userEvent.click(button)

  expect(header).toHaveAttribute('aria-sort', 'descending')
  expect(getNames()).toEqual(['Name C', 'Name B', 'Name A'])

  await userEvent.click(button)

  expect(header).toHaveAttribute('aria-sort', 'none')
  expect(getNames()).toEqual(['Name B', 'Name A', 'Name C'])
})

test('leaves sorting to the parent when the sort is controlled', async () => {
  const onSortChange = vi.fn()
  render(
    <Table
      caption="People"
      columns={COLUMNS}
      rows={PEOPLE}
      getRowId={(person) => person.id}
      sort={{ columnId: 'name', direction: 'descending' }}
      onSortChange={onSortChange}
    />,
  )

  expect(getNames()).toEqual(['Name B', 'Name A', 'Name C'])

  await userEvent.click(screen.getByRole('button', { name: 'Name' }))

  expect(onSortChange).toHaveBeenCalledWith(null)
})

test('selects rows one by one or all at once', async () => {
  const onSelectionChange = vi.fn()
  const { container } = render(
    <Table
      caption="People"
      columns={COLUMNS}
      rows={PEOPLE}
      getRowId={(person) => person.id}
      getRowLabel={(person) => `Select ${person.name}`}
      isSelectable
      onSelectionChange={onSelectionChange}
    />,
  )
  const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' })

  await userEvent.click(screen.getByRole('checkbox', { name: 'Select Name A' }))

  expect(onSelectionChange).toHaveBeenLastCalledWith(['a'])
  expect(selectAll).toHaveProperty('indeterminate', true)
  expect(
    screen.getByRole('checkbox', { name: 'Select Name A' }).closest('tr'),
  ).toHaveAttribute('aria-selected', 'true')

  await userEvent.click(selectAll)

  expect(onSelectionChange).toHaveBeenLastCalledWith(['a', 'b', 'c'])
  expect(selectAll).toBeChecked()

  await userEvent.click(selectAll)

  expect(onSelectionChange).toHaveBeenLastCalledWith([])
  await expectNoA11yViolations(container)
})

test('shows placeholder rows while loading', () => {
  render(
    <Table
      caption="People"
      columns={COLUMNS}
      rows={[]}
      getRowId={(person) => person.id}
      isLoading
      loadingRows={2}
    />,
  )

  expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true')
  expect(screen.getAllByRole('row')).toHaveLength(3)
})

test('shows an empty state across every column', () => {
  render(
    <Table
      caption="People"
      columns={COLUMNS}
      rows={[]}
      getRowId={(person) => person.id}
      emptyState={<p>No people yet</p>}
    />,
  )

  expect(screen.getByText('No people yet').closest('td')).toHaveAttribute(
    'colspan',
    '2',
  )
})

test('applies density, stripes and a sticky header', () => {
  const { container } = render(
    <Table
      caption="People"
      columns={COLUMNS}
      rows={PEOPLE}
      getRowId={(person) => person.id}
      density="compact"
      isStriped
      isStickyHeader
      isCaptionHidden
    />,
  )

  expectStyle(screen.getByRole('table'), styles, 'compact')
  expectStyle(screen.getByRole('table'), styles, 'striped')
  expectStyle(container.firstElementChild, styles, 'sticky')
  expectStyle(container.querySelector('caption'), styles, 'hidden')
})

test('puts a filter menu in the header and reports the choice', async () => {
  const onChange = vi.fn()
  render(
    <Table
      caption="People"
      columns={[
        {
          id: 'name',
          header: 'Name',
          cell: (person) => person.name,
          filter: {
            label: 'Filter by name',
            value: 'a',
            options: [
              { value: 'a', label: 'Name A' },
              { value: 'b', label: 'Name B' },
            ],
            onChange,
          },
        },
      ]}
      rows={PEOPLE}
      getRowId={(person) => person.id}
    />,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Filter by name' }))
  expect(screen.getByRole('menuitemradio', { name: 'Name A' })).toBeChecked()

  await userEvent.click(screen.getByRole('menuitemradio', { name: 'Name B' }))
  expect(onChange).toHaveBeenCalledWith('b')

  await userEvent.click(screen.getByRole('button', { name: 'Filter by name' }))
  await userEvent.click(screen.getByRole('menuitemradio', { name: 'All' }))
  expect(onChange).toHaveBeenLastCalledWith(undefined)
})

test('puts a search box in the header that applies on Search and clears on Reset', async () => {
  const onChange = vi.fn()
  render(
    <Table
      caption="People"
      columns={[
        {
          id: 'name',
          header: 'Name',
          cell: (person) => person.name,
          search: { label: 'Search names', value: 'ann', onChange },
        },
      ]}
      rows={PEOPLE}
      getRowId={(person) => person.id}
    />,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Search names' }))
  const box = screen.getByRole('searchbox', { name: 'Search names' })
  expect(box).toHaveValue('ann')

  await userEvent.type(box, 'a')
  expect(onChange).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Search' }))
  expect(onChange).toHaveBeenCalledWith('anna')

  await userEvent.click(screen.getByRole('button', { name: 'Search names' }))
  await userEvent.click(screen.getByRole('button', { name: 'Reset' }))
  expect(onChange).toHaveBeenLastCalledWith('')
})
