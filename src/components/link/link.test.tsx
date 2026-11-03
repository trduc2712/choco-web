import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { expect, test } from 'vitest'

import type { LinkVariant } from '@/components/link/link'
import { Link } from '@/components/link/link'
import styles from '@/components/link/link.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectStyle } from '@/test/styles'

test('renders an in-app link', async () => {
  const { container } = render(
    <MemoryRouter>
      <Link to="/profile">Profile</Link>
    </MemoryRouter>,
  )

  expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute(
    'href',
    '/profile',
  )
  await expectNoA11yViolations(container)
})

test('warns that an external link opens in a new tab', () => {
  render(<Link href="https://example.com">Docs</Link>)

  const link = screen.getByRole('link', {
    name: new RegExp(
      `Docs.*${i18n.t('common.opensInNewTab').replace(/[()]/g, '\\$&')}`,
    ),
  })

  expect(link).toHaveAttribute('target', '_blank')
  expect(link).toHaveAttribute('rel', 'noopener noreferrer')
})

const VARIANTS: LinkVariant[] = ['inline', 'standalone', 'subtle']

test.each(VARIANTS)('applies the %s variant to in-app links', (variant) => {
  render(
    <MemoryRouter>
      <Link to="/profile" variant={variant}>
        Profile
      </Link>
    </MemoryRouter>,
  )

  expectStyle(screen.getByRole('link'), styles, variant)
})

test.each(VARIANTS)('applies the %s variant to external links', (variant) => {
  render(
    <Link href="https://example.com" variant={variant}>
      Docs
    </Link>,
  )

  expectStyle(screen.getByRole('link'), styles, variant)
})

test('marks external links with an icon', () => {
  render(<Link href="https://example.com">Docs</Link>)

  expect(screen.getByRole('link').querySelector('svg')).toBeInTheDocument()
})
