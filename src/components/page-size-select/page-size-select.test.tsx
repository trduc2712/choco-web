import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { PageSizeSelect } from '@/components/page-size-select/page-size-select'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test('shows the current size and lists the default sizes', async () => {
  render(<PageSizeSelect value={20} onChange={() => {}} />)

  const trigger = screen.getByRole('combobox', {
    name: i18n.t('pageSizeSelect.label'),
  })
  expect(trigger).toHaveTextContent(
    i18n.t('pageSizeSelect.option', { count: 20 }),
  )

  await userEvent.click(trigger)

  expect(
    screen.getAllByRole('option').map((option) => option.textContent),
  ).toEqual(
    [10, 20, 30, 50].map((count) => i18n.t('pageSizeSelect.option', { count })),
  )
})

test('gives the chosen size as a number', async () => {
  const onChange = vi.fn<(pageSize: number) => void>()
  render(<PageSizeSelect value={20} onChange={onChange} />)

  await userEvent.click(screen.getByRole('combobox'))
  await userEvent.click(
    screen.getByRole('option', {
      name: i18n.t('pageSizeSelect.option', { count: 50 }),
    }),
  )

  expect(onChange).toHaveBeenCalledWith(50)
})

test('takes custom sizes and a custom label', () => {
  render(
    <PageSizeSelect
      value={5}
      options={[5, 15]}
      label="Rows"
      onChange={() => {}}
    />,
  )

  expect(screen.getByRole('combobox', { name: 'Rows' })).toHaveTextContent(
    i18n.t('pageSizeSelect.option', { count: 5 }),
  )
})

test('has no accessibility violations', async () => {
  const { container } = render(
    <PageSizeSelect value={20} onChange={() => {}} />,
  )

  await expectNoA11yViolations(container)
})
