import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { SearchInput } from '@/components/search-input/search-input'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test('is a search box that can be cleared', async () => {
  const onChange = vi.fn()
  const onSearch = vi.fn()
  const { container } = render(
    <SearchInput label="Search" onChange={onChange} onSearch={onSearch} />,
  )
  const input = screen.getByRole('searchbox', { name: 'Search' })

  expect(
    screen.queryByRole('button', { name: i18n.t('searchInput.clear') }),
  ).not.toBeInTheDocument()

  await userEvent.type(input, 'search-query{Enter}')

  expect(onSearch).toHaveBeenCalledWith('search-query')
  await expectNoA11yViolations(container)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('searchInput.clear') }),
  )

  expect(input).toHaveValue('')
  expect(input).toHaveFocus()
  expect(onChange).toHaveBeenLastCalledWith('')
})

test('clears with Escape', async () => {
  render(<SearchInput label="Search" defaultValue="search-query" />)
  const input = screen.getByRole('searchbox')

  await userEvent.click(input)
  await userEvent.keyboard('{Escape}')

  expect(input).toHaveValue('')
})
