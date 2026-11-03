import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { DescriptionList } from '@/components/description-list/description-list'
import styles from '@/components/description-list/description-list.module.scss'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('pairs terms with descriptions', async () => {
  const { container } = render(
    <DescriptionList
      isDivided
      items={[
        { id: 'username', term: 'Username', description: 'username' },
        { id: 'email', term: 'Email', description: 'user@example.com' },
      ]}
    />,
  )

  expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
    'Username',
    'Email',
  ])
  expect(screen.getAllByRole('definition')[0]).toHaveTextContent('username')
  expectStyle(container.firstElementChild, styles, 'divided')
  await expectNoA11yViolations(container)
})
