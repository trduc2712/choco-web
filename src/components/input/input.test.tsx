import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Input } from '@/components/input/input'
import { expectNoA11yViolations } from '@/test/a11y'

test('is labelled and described by its hint', async () => {
  const { container } = render(<Input label="Name" hint="As shown to others" />)
  const input = screen.getByRole('textbox', { name: 'Name' })

  await userEvent.type(input, 'Jane')

  expect(input).toHaveValue('Jane')
  expect(input).toHaveAccessibleDescription('As shown to others')
  await expectNoA11yViolations(container)
})

test('is marked invalid and described by its error', async () => {
  const { container } = render(
    <Input label="Name" hint="As shown to others" error="Enter a name" />,
  )
  const input = screen.getByRole('textbox', { name: 'Name' })

  expect(input).toBeInvalid()
  expect(input).toHaveAccessibleDescription('As shown to others Enter a name')
  await expectNoA11yViolations(container)
})

test('says when it is required', () => {
  render(<Input label="Name" required />)

  expect(screen.getByRole('textbox', { name: /Name.*required/ })).toBeRequired()
})

test('keeps its label for assistive technology when visually hidden', () => {
  render(<Input label="Search" isLabelHidden />)

  expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument()
})

test('keeps the search symbol out of the accessible name', () => {
  const { container } = render(<Input label="Name" icon="search" />)
  expect(container.querySelector('[aria-hidden="true"]')).toHaveTextContent(
    '\u26b2',
  )
  expect(screen.getByRole('textbox')).toHaveAccessibleName('Name')
})

test('cannot be edited while disabled', async () => {
  render(<Input label="Name" disabled />)
  const input = screen.getByRole('textbox')

  await userEvent.type(input, 'Jane')

  expect(input).toBeDisabled()
  expect(input).toHaveValue('')
})
