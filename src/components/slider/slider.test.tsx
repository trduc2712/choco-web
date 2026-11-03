import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import { RangeSlider, Slider } from '@/components/slider/slider'
import { expectNoA11yViolations } from '@/test/a11y'

test('is a labelled slider that shows its formatted value', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <Slider
      label="Volume"
      defaultValue={40}
      formatValue={(value) => `${value}%`}
      hint="Applies to every device"
      onChange={onChange}
    />,
  )
  const slider = screen.getByRole('slider', { name: 'Volume' })

  expect(slider).toHaveAttribute('aria-valuetext', '40%')
  expect(slider).toHaveAccessibleDescription('Applies to every device')
  expect(screen.getByRole('status')).toHaveTextContent('40%')

  fireEvent.change(slider, { target: { value: '41' } })

  expect(onChange).toHaveBeenLastCalledWith(41)
  await expectNoA11yViolations(container)
})

test('keeps the two thumbs of a range in order', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <RangeSlider
      label="Price"
      defaultValue={[20, 60]}
      thumbLabels={['Minimum price', 'Maximum price']}
      onChange={onChange}
    />,
  )
  const minimum = screen.getByRole('slider', { name: 'Minimum price' })

  expect(screen.getByRole('group', { name: 'Price' })).toBeInTheDocument()

  fireEvent.change(minimum, { target: { value: '80' } })

  expect(onChange).toHaveBeenLastCalledWith([60, 60])
  await expectNoA11yViolations(container)
})
