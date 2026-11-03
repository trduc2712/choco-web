import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { getPageRange } from '@/components/pagination/get-page-range'
import { Pagination } from '@/components/pagination/pagination'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test.each([
  [1, 1, [1]],
  [1, 5, [1, 2, 'gap-end', 5]],
  [5, 10, [1, 'gap-start', 4, 5, 6, 'gap-end', 10]],
  [10, 10, [1, 'gap-start', 9, 10]],
  [2, 3, [1, 2, 3]],
])('page %i of %i shows %j', (page, pageCount, expected) => {
  expect(getPageRange(page, pageCount, 1)).toEqual(expected)
})

test('marks the current page and moves between pages', async () => {
  const onPageChange = vi.fn<(page: number) => void>()
  const { container } = render(
    <Pagination page={5} pageCount={10} onPageChange={onPageChange} />,
  )

  expect(
    screen.getByRole('button', {
      name: i18n.t('pagination.page', { page: 5 }),
    }),
  ).toHaveAttribute('aria-current', 'page')

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('pagination.next') }),
  )
  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('pagination.page', { page: 10 }),
    }),
  )

  expect(onPageChange.mock.calls).toEqual([[6], [10]])
  await expectNoA11yViolations(container)
})

test('disables previous on the first page and next on the last', () => {
  const { rerender } = render(
    <Pagination page={1} pageCount={3} onPageChange={vi.fn()} />,
  )

  expect(
    screen.getByRole('button', { name: i18n.t('pagination.previous') }),
  ).toBeDisabled()

  rerender(<Pagination page={3} pageCount={3} onPageChange={vi.fn()} />)

  expect(
    screen.getByRole('button', { name: i18n.t('pagination.next') }),
  ).toBeDisabled()
})
