import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type { AvatarStatus } from '@/components/avatar/avatar'
import { Avatar } from '@/components/avatar/avatar'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

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

test('shows a silhouette instead of initials when asked to', () => {
  render(<Avatar name="Ada Lovelace" fallback="person" />)

  const avatar = screen.getByRole('img', { name: 'Ada Lovelace' })
  expect(avatar.querySelector('svg')).toBeInTheDocument()
  expect(avatar).not.toHaveTextContent('AL')
})

test('falls back to initials when the image fails to load', () => {
  render(<Avatar name="Ada" src="/broken.png" />)

  const image = screen.getByRole('img', { name: 'Ada' })
  fireEvent.error(image)

  const fallback = screen.getByRole('img', { name: 'Ada' })
  expect(fallback).toHaveTextContent('A')
})

test('announces the status', async () => {
  const { container } = render(<Avatar name="Ada" status="online" />)

  expect(screen.getByText(i18n.t('avatar.status.online'))).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

const STATUSES: AvatarStatus[] = ['online', 'busy', 'offline']

test.each(STATUSES)('shows and announces the %s status', (status) => {
  render(<Avatar name="Ada" status={status} />)
  expect(
    screen.getByText(i18n.t(`avatar.status.${status}`)),
  ).toBeInTheDocument()
})

test('uses a single initial for a one-word name', () => {
  render(<Avatar name="ada" />)

  expect(screen.getByRole('img', { name: 'ada' })).toHaveTextContent('A')
})
