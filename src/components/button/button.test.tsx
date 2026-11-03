import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { ButtonSize, ButtonVariant } from '@/components/button/button'
import { Button } from '@/components/button/button'
import styles from '@/components/button/button.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('renders a button that does not submit forms by default', async () => {
  const onClick = vi.fn()
  const { container } = render(<Button onClick={onClick}>Save</Button>)

  const button = screen.getByRole('button', { name: 'Save' })
  await userEvent.click(button)

  expect(button).toHaveAttribute('type', 'button')
  expect(onClick).toHaveBeenCalledTimes(1)
  await expectNoA11yViolations(container)
})

test('stays focusable but ignores clicks while loading', async () => {
  const onClick = vi.fn()
  render(
    <Button isLoading onClick={onClick}>
      Save
    </Button>,
  )

  const button = screen.getByRole('button', { name: 'Save' })
  await userEvent.click(button)

  expect(button).toHaveAttribute('aria-busy', 'true')
  expect(button).toHaveAttribute('aria-disabled', 'true')
  expect(button).toHaveFocus()
  expect(onClick).not.toHaveBeenCalled()
})

test('does not submit a form while loading', async () => {
  const onSubmit = vi.fn()
  render(
    <form onSubmit={onSubmit}>
      <Button type="submit" isLoading>
        Save
      </Button>
    </form>,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Save' }))

  expect(onSubmit).not.toHaveBeenCalled()
})

test('ignores clicks when disabled', async () => {
  const onClick = vi.fn()
  render(
    <Button disabled onClick={onClick}>
      Save
    </Button>,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Save' }))

  expect(onClick).not.toHaveBeenCalled()
})

test('is named by its aria-label when it only shows an icon', async () => {
  const { container } = render(<Button icon="heart" aria-label="Favorite" />)

  expect(screen.getByRole('button', { name: 'Favorite' })).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('keeps its text as the name when it also shows icons', () => {
  render(
    <Button iconStart="plus" iconEnd="chevron-down">
      Add
    </Button>,
  )

  expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
})

test('exposes its pressed state', () => {
  render(<Button icon="heart" aria-label="Favorite" aria-pressed />)

  expect(screen.getByRole('button', { name: 'Favorite' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

const VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'subtle',
  'ghost',
  'danger',
  'link',
]
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']

test.each(VARIANTS)('applies the %s variant', (variant) => {
  render(<Button variant={variant}>Save</Button>)

  expectStyle(screen.getByRole('button'), styles, variant)
})

test.each(SIZES)('applies the %s size', (size) => {
  render(<Button size={size}>Save</Button>)

  expectStyle(screen.getByRole('button'), styles, size)
})

test('applies the pill shape, full width and icon-only layouts', () => {
  render(
    <>
      <Button shape="pill">Pill</Button>
      <Button isFullWidth>Wide</Button>
      <Button icon="plus" aria-label="Add" />
    </>,
  )

  expectStyle(screen.getByRole('button', { name: 'Pill' }), styles, 'pill')
  expectStyle(screen.getByRole('button', { name: 'Wide' }), styles, 'fullWidth')
  expectStyle(screen.getByRole('button', { name: 'Add' }), styles, 'iconOnly')
})

test('shows a spinner in place of the leading icon while loading', () => {
  const { container } = render(
    <Button iconStart="check" isLoading>
      Save
    </Button>,
  )

  expect(container.querySelector('svg')).not.toBeInTheDocument()
})
