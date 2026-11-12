import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { UserCard } from '@/components/user-card/user-card'
import styles from '@/components/user-card/user-card.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('shows the avatar, the name and the description', async () => {
  const { container } = render(
    <UserCard name="Ada Lovelace" description="@ada" />,
  )

  expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeVisible()
  expect(screen.getByText('Ada Lovelace')).toBeVisible()
  expect(screen.getByText('@ada')).toBeVisible()
  await expectNoA11yViolations(container)
})

test('works without a description', () => {
  render(<UserCard name="Ada Lovelace" />)

  expect(screen.getByText('Ada Lovelace')).toBeVisible()
  expect(screen.queryByText('@ada')).not.toBeInTheDocument()
})

test('can hide the avatar from assistive technology', () => {
  render(<UserCard name="Ada Lovelace" isAvatarHidden />)

  expect(screen.queryByRole('img')).not.toBeInTheDocument()
})

test('adds a column for trailing content', () => {
  const { container } = render(
    <UserCard name="Ada Lovelace" trailing={<span>more</span>} />,
  )

  expect(screen.getByText('more')).toBeVisible()
  expectStyle(container.firstElementChild, styles, 'withTrailing')
})
