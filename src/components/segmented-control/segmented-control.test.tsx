import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { SegmentedControl } from '@/components/segmented-control/segmented-control'
import { expectNoA11yViolations } from '@/test/a11y'

function renderControl(onChange = vi.fn()) {
  return render(
    <SegmentedControl
      label="View"
      options={[
        { value: 'list', label: 'List', icon: 'layout-list' },
        {
          value: 'grid',
          label: 'Grid',
          icon: 'layout-grid',
          isLabelHidden: true,
        },
        { value: 'board', label: 'Board', isDisabled: true },
      ]}
      onChange={onChange}
    />,
  )
}

test('is a radio group with the first option selected', async () => {
  const { container } = renderControl()

  expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'List' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Grid' })).toHaveAttribute(
    'tabindex',
    '-1',
  )
  await expectNoA11yViolations(container)
})

test('selects on click', async () => {
  const onChange = vi.fn()
  renderControl(onChange)

  await userEvent.click(screen.getByRole('radio', { name: 'Grid' }))

  expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked()
  expect(onChange).toHaveBeenCalledWith('grid')
})

test('moves with the arrow keys and skips disabled options', async () => {
  renderControl()

  await userEvent.tab()
  await userEvent.keyboard('{ArrowRight}')

  expect(screen.getByRole('radio', { name: 'Grid' })).toHaveFocus()
  expect(screen.getByRole('radio', { name: 'Grid' })).toBeChecked()

  await userEvent.keyboard('{ArrowRight}')

  expect(screen.getByRole('radio', { name: 'List' })).toHaveFocus()
})
