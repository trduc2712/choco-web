import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import type { InputSize } from '@/components/input/input'
import { Input } from '@/components/input/input'
import styles from '@/components/input/input.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

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

const SIZES: InputSize[] = ['sm', 'md', 'lg']

test.each(SIZES)('applies the %s size', (size) => {
  render(<Input label="Name" size={size} />)

  expectStyle(screen.getByRole('textbox'), styles, size)
})

test('makes room for its icon', () => {
  const { container } = render(<Input label="Name" icon="search" />)

  expectStyle(screen.getByRole('textbox'), styles, 'withIcon')
  expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
})

test('cannot be edited while disabled', async () => {
  render(<Input label="Name" disabled />)
  const input = screen.getByRole('textbox')

  await userEvent.type(input, 'Jane')

  expect(input).toBeDisabled()
  expect(input).toHaveValue('')
})
