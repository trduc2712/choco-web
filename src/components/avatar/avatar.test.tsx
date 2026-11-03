import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type {
  AvatarShape,
  AvatarSize,
  AvatarStatus,
} from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import styles from '@/components/avatar/avatar.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('shows the image with the name as its alternative text', async () => {
  const { container } = render(<Avatar name="Ada Lovelace" src="/ada.png" />)

  expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveAttribute(
    'src',
    '/ada.png',
  )
  await expectNoA11yViolations(container)
})

test('shows initials when there is no image', async () => {
  const { container } = render(<Avatar name="Ada King Lovelace" />)

  expect(
    screen.getByRole('img', { name: 'Ada King Lovelace' }),
  ).toHaveTextContent('AL')
  await expectNoA11yViolations(container)
})

test('falls back to initials when the image fails to load', () => {
  render(<Avatar name="Ada" src="/broken.png" />)

  fireEvent.error(screen.getByRole('img', { name: 'Ada' }))

  expect(screen.getByRole('img', { name: 'Ada' })).toHaveTextContent('A')
})

test('announces the status', async () => {
  const { container } = render(<Avatar name="Ada" status="online" />)

  expect(screen.getByText(i18n.t('avatar.status.online'))).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

const SIZES: AvatarSize[] = ['xs', 'sm', 'md', 'lg', 'xl']
const SHAPES: AvatarShape[] = ['circle', 'square']
const STATUSES: AvatarStatus[] = ['online', 'busy', 'offline']

test.each(SIZES)('applies the %s size', (size) => {
  const { container } = render(<Avatar name="Ada" size={size} />)

  expectStyle(container.firstElementChild, styles, size)
})

test.each(SHAPES)('applies the %s shape', (shape) => {
  const { container } = render(<Avatar name="Ada" shape={shape} />)

  expectStyle(container.firstElementChild, styles, shape)
})

test.each(STATUSES)('shows and announces the %s status', (status) => {
  const { container } = render(<Avatar name="Ada" status={status} />)

  expectStyle(container.querySelector(`.${styles.status}`), styles, status)
  expect(
    screen.getByText(i18n.t(`avatar.status.${status}`)),
  ).toBeInTheDocument()
})

test('uses a single initial for a one-word name', () => {
  render(<Avatar name="ada" />)

  expect(screen.getByRole('img', { name: 'ada' })).toHaveTextContent('A')
})
