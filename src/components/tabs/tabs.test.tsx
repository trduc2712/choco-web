import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { TabsVariant } from '@/components/tabs/tabs'
import type { TabItem } from '@/components/tabs/tabs'
import { Tabs } from '@/components/tabs/tabs'
import styles from '@/components/tabs/tabs.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

const ITEMS: TabItem[] = [
  { id: 'one', label: 'One', content: 'First panel' },
  { id: 'two', label: 'Two', content: 'Second panel', isDisabled: true },
  { id: 'three', label: 'Three', content: 'Third panel' },
]

test('shows the first panel and links it to its tab', async () => {
  const { container } = render(<Tabs label="Sections" items={ITEMS} />)

  expect(screen.getByRole('tablist', { name: 'Sections' })).toBeInTheDocument()
  expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute(
    'aria-selected',
    'true',
  )
  expect(screen.getByRole('tabpanel', { name: 'One' })).toHaveTextContent(
    'First panel',
  )
  await expectNoA11yViolations(container)
})

test('switches panel when a tab is clicked', async () => {
  const onChange = vi.fn<(id: string) => void>()
  render(<Tabs label="Sections" items={ITEMS} onChange={onChange} />)

  await userEvent.click(screen.getByRole('tab', { name: 'Three' }))

  expect(onChange).toHaveBeenCalledWith('three')
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Third panel')
})

test('moves with the arrow keys, skipping disabled tabs and wrapping', async () => {
  render(<Tabs label="Sections" items={ITEMS} />)

  await userEvent.tab()
  await userEvent.keyboard('{ArrowRight}')

  expect(screen.getByRole('tab', { name: 'Three' })).toHaveFocus()
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Third panel')

  await userEvent.keyboard('{ArrowRight}')

  expect(screen.getByRole('tab', { name: 'One' })).toHaveFocus()
})

const VARIANTS: TabsVariant[] = ['line', 'pill']

test.each(VARIANTS)('applies the %s variant', (variant) => {
  render(<Tabs label="Sections" items={ITEMS} variant={variant} />)

  expectStyle(screen.getByRole('tablist'), styles, variant)
})

test('starts on the default tab', () => {
  render(<Tabs label="Sections" items={ITEMS} defaultValue="three" />)

  expect(screen.getByRole('tabpanel')).toHaveTextContent('Third panel')
})

test('follows a controlled value', async () => {
  const onChange = vi.fn<(id: string) => void>()
  render(
    <Tabs label="Sections" items={ITEMS} value="one" onChange={onChange} />,
  )

  await userEvent.click(screen.getByRole('tab', { name: 'Three' }))

  expect(onChange).toHaveBeenCalledWith('three')
  expect(screen.getByRole('tabpanel')).toHaveTextContent('First panel')
})

test('does not select a disabled tab', async () => {
  render(<Tabs label="Sections" items={ITEMS} />)

  await userEvent.click(screen.getByRole('tab', { name: 'Two' }))

  expect(screen.getByRole('tabpanel')).toHaveTextContent('First panel')
})
