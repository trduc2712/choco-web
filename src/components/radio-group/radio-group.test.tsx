import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { RadioGroup } from '@/components/radio-group/radio-group'
import styles from '@/components/radio-group/radio-group.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

const OPTIONS = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta', hint: 'Second option' },
  { value: 'c', label: 'Gamma', isDisabled: true },
]

test('groups its options under the label and reports the choice', async () => {
  const onChange = vi.fn<(value: string) => void>()
  const { container } = render(
    <RadioGroup
      label="Group"
      name="group"
      options={OPTIONS}
      defaultValue="a"
      onChange={onChange}
    />,
  )

  expect(screen.getByRole('group', { name: 'Group' })).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: 'Alpha' })).toBeChecked()

  await userEvent.click(screen.getByRole('radio', { name: 'Beta' }))

  expect(onChange).toHaveBeenCalledWith('b')
  expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked()
  expect(screen.getByRole('radio', { name: 'Gamma' })).toBeDisabled()
  await expectNoA11yViolations(container)
})

test('moves between options with the arrow keys', async () => {
  render(
    <RadioGroup
      label="Group"
      name="group"
      options={OPTIONS}
      defaultValue="a"
    />,
  )

  await userEvent.tab()
  await userEvent.keyboard('{ArrowDown}')

  expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked()
})

test.each(['vertical', 'horizontal'] as const)(
  'applies the %s orientation',
  (orientation) => {
    render(
      <RadioGroup
        label="Group"
        name="group"
        options={OPTIONS}
        orientation={orientation}
      />,
    )

    expectStyle(
      screen.getByRole('group').querySelector(`.${styles.options}`),
      styles,
      orientation,
    )
  },
)

test('describes an option by its hint and the group by its error', () => {
  render(
    <RadioGroup
      label="Group"
      name="group"
      options={OPTIONS}
      error="Choose one"
    />,
  )

  expect(
    screen.getByRole('radio', { name: 'Beta' }),
  ).toHaveAccessibleDescription('Second option')
  expect(screen.getByRole('group')).toHaveAccessibleDescription('Choose one')
})

test('follows a controlled value', () => {
  const { rerender } = render(
    <RadioGroup label="Group" name="group" options={OPTIONS} value="a" />,
  )

  rerender(
    <RadioGroup label="Group" name="group" options={OPTIONS} value="b" />,
  )

  expect(screen.getByRole('radio', { name: 'Beta' })).toBeChecked()
})
