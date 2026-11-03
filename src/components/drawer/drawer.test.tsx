import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import type { DrawerSide } from '@/components/drawer/drawer'
import { Drawer } from '@/components/drawer/drawer'
import styles from '@/components/drawer/drawer.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('opens as a labelled, described modal panel', async () => {
  const { container } = render(
    <Drawer
      isOpen
      title="Filters"
      description="Narrow down the list"
      footer={<button type="button">Apply</button>}
      onClose={vi.fn()}
    >
      Body
    </Drawer>,
  )
  const drawer = screen.getByRole('dialog', { name: 'Filters' })

  expect(drawer).toHaveAttribute('open')
  expect(drawer).toHaveAccessibleDescription('Narrow down the list')
  expect(drawer).toHaveTextContent('Body')
  expect(screen.getByRole('button', { name: 'Apply' })).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('closes from its close button', async () => {
  const onClose = vi.fn()
  render(
    <Drawer isOpen title="Filters" onClose={onClose}>
      Body
    </Drawer>,
  )

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('common.close') }),
  )

  expect(onClose).toHaveBeenCalledTimes(1)
})

test('closes the native dialog when isOpen turns false', () => {
  const { container, rerender } = render(
    <Drawer isOpen title="Filters" onClose={vi.fn()} />,
  )

  rerender(<Drawer isOpen={false} title="Filters" onClose={vi.fn()} />)

  expect(container.querySelector('dialog')).not.toHaveAttribute('open')
})

const SIDES: DrawerSide[] = ['start', 'end', 'bottom']

test.each(SIDES)('slides in from the %s side', (side) => {
  render(<Drawer isOpen side={side} title="Filters" onClose={vi.fn()} />)

  expectStyle(screen.getByRole('dialog'), styles, side)
})
