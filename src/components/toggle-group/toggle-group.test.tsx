import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { ToggleButton } from '@/components/toggle-button/toggle-button'
import { ToggleGroup } from '@/components/toggle-group/toggle-group'
import { expectNoA11yViolations } from '@/test/a11y'

const ITEMS = [
  { value: 'bold', label: 'Bold', icon: 'bold', isLabelHidden: true },
  { value: 'italic', label: 'Italic', icon: 'italic', isLabelHidden: true },
  {
    value: 'underline',
    label: 'Underline',
    icon: 'underline',
    isLabelHidden: true,
  },
] as const

test('a toggle button reports its pressed state', async () => {
  const onPressedChange = vi.fn()
  const { container } = render(
    <ToggleButton icon="star" onPressedChange={onPressedChange}>
      Favorite
    </ToggleButton>,
  )
  const button = screen.getByRole('button', { name: 'Favorite' })

  expect(button).toHaveAttribute('aria-pressed', 'false')

  await userEvent.click(button)

  expect(button).toHaveAttribute('aria-pressed', 'true')
  expect(onPressedChange).toHaveBeenCalledWith(true)
  await expectNoA11yViolations(container)
})

test('a single group keeps at most one item pressed', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <ToggleGroup label="Alignment" items={[...ITEMS]} onChange={onChange} />,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Bold' }))
  await userEvent.click(screen.getByRole('button', { name: 'Italic' }))

  expect(onChange).toHaveBeenLastCalledWith(['italic'])
  expect(screen.getByRole('button', { name: 'Bold' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  expect(screen.getByRole('group', { name: 'Alignment' })).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('a multiple group presses several items', async () => {
  const onChange = vi.fn()
  render(
    <ToggleGroup
      label="Formatting"
      items={[...ITEMS]}
      isMultiple
      defaultValue={['bold']}
      onChange={onChange}
    />,
  )

  await userEvent.click(screen.getByRole('button', { name: 'Underline' }))

  expect(onChange).toHaveBeenLastCalledWith(['bold', 'underline'])
})

test('is one tab stop and moves with the arrow keys', async () => {
  render(<ToggleGroup label="Formatting" items={[...ITEMS]} />)

  await userEvent.tab()

  expect(screen.getByRole('button', { name: 'Bold' })).toHaveFocus()

  await userEvent.keyboard('{ArrowLeft}')

  expect(screen.getByRole('button', { name: 'Underline' })).toHaveFocus()

  await userEvent.tab({ shift: true })
  await userEvent.tab()

  expect(screen.getByRole('button', { name: 'Underline' })).toHaveFocus()
})
