import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { AvatarGroup } from '@/components/avatar-group/avatar-group'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const PEOPLE = [1, 2, 3, 4, 5].map((number) => ({
  id: `identity-id-${number}`,
  name: `Display Name ${number}`,
}))

test('shows up to the maximum and summarises the rest', async () => {
  const { container } = render(
    <AvatarGroup label="Group Label" people={PEOPLE} max={3} />,
  )

  expect(
    screen.getByRole('list', { name: 'Group Label' }).children,
  ).toHaveLength(3)
  expect(
    screen.getByRole('img', {
      name: i18n.t('avatarGroup.more', { count: 3 }),
    }),
  ).toHaveTextContent('+3')
  await expectNoA11yViolations(container)
})

test('shows everyone when they fit', () => {
  render(<AvatarGroup label="Group Label" people={PEOPLE.slice(0, 2)} />)

  expect(
    screen.getByRole('img', { name: 'Display Name 1' }),
  ).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})
