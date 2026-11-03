import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Rating } from '@/components/rating/rating'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test('picks a rating from radio stars', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <Rating label="Rating Label" defaultValue={2} onChange={onChange} />,
  )

  expect(
    screen.getByRole('group', { name: 'Rating Label' }),
  ).toBeInTheDocument()
  expect(
    screen.getByRole('radio', { name: i18n.t('rating.star', { count: 2 }) }),
  ).toBeChecked()

  await userEvent.click(
    screen.getByRole('radio', { name: i18n.t('rating.star', { count: 4 }) }),
  )

  expect(onChange).toHaveBeenCalledWith(4)
  await expectNoA11yViolations(container)
})

test('shows a read-only rating as one image', async () => {
  const { container } = render(
    <Rating label="Read Only Label" value={3.6} isReadOnly />,
  )

  expect(
    screen.getByRole('img', {
      name: `Read Only Label: ${i18n.t('rating.value', { value: 3.6, max: 5 })}`,
    }),
  ).toBeInTheDocument()
  expect(screen.queryByRole('radio')).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})
