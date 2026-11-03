import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Button } from '@/components/button/button'
import type { EmptyStateSize } from '@/components/empty-state/empty-state'
import { EmptyState } from '@/components/empty-state/empty-state'
import styles from '@/components/empty-state/empty-state.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('renders the title, description and action', async () => {
  const { container } = render(
    <EmptyState
      icon="inbox"
      title="No posts yet"
      description="Posts you share will show up here."
      action={<Button>Create post</Button>}
    />,
  )

  expect(
    screen.getByRole('heading', { level: 2, name: 'No posts yet' }),
  ).toBeInTheDocument()
  expect(
    screen.getByText('Posts you share will show up here.'),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: 'Create post' }),
  ).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('can announce itself as an alert', () => {
  render(<EmptyState role="alert" title="Something went wrong" />)

  expect(
    within(screen.getByRole('alert')).getByRole('heading', {
      name: 'Something went wrong',
    }),
  ).toBeInTheDocument()
})

const SIZES: EmptyStateSize[] = ['sm', 'md', 'lg']

test.each(SIZES)('applies the %s size', (size) => {
  const { container } = render(<EmptyState size={size} title="Empty" />)

  expectStyle(container.firstElementChild, styles, size)
})

test('uses the requested heading level', () => {
  render(<EmptyState headingLevel={4} title="Empty" />)

  expect(
    screen.getByRole('heading', { level: 4, name: 'Empty' }),
  ).toBeInTheDocument()
})
