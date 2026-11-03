import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vitest'

import { ThemeToggle } from '@/features/theme/theme-toggle'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

afterEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

function getTrigger() {
  return screen.getByRole('button', { name: i18n.t('theme.label') })
}

function getOption(theme: 'system' | 'light' | 'dark') {
  return screen.getByRole('menuitemradio', { name: i18n.t(`theme.${theme}`) })
}

test('opens on the system theme by default', async () => {
  const { container } = render(<ThemeToggle />)

  await userEvent.click(getTrigger())

  expect(getOption('system')).toHaveAttribute('aria-checked', 'true')
  expect(getOption('system')).toHaveFocus()
  await expectNoA11yViolations(container)
})

test('switches to the chosen theme and closes the menu', async () => {
  render(<ThemeToggle />)

  await userEvent.click(getTrigger())
  await userEvent.click(getOption('dark'))

  expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(getTrigger()).toHaveFocus()

  await userEvent.click(getTrigger())

  expect(getOption('dark')).toHaveAttribute('aria-checked', 'true')
  expect(getOption('system')).toHaveAttribute('aria-checked', 'false')
})

test('shows the icon of the theme in use', async () => {
  render(<ThemeToggle />)
  const iconOf = () => getTrigger().querySelector('path')?.getAttribute('d')
  const lightIcon = iconOf()

  await userEvent.click(getTrigger())
  await userEvent.click(getOption('dark'))

  expect(iconOf()).not.toBe(lightIcon)
})
