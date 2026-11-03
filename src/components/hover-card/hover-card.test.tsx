import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { HoverCard } from '@/components/hover-card/hover-card'
import { Link } from '@/components/link/link'
import { expectNoA11yViolations } from '@/test/a11y'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

function renderHoverCard() {
  return render(
    <HoverCard
      trigger={<Link href="https://example.com/profile">Display Name</Link>}
    >
      Hover card content
    </HoverCard>,
  )
}

test('opens after a delay on hover and describes its trigger', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  const { container } = renderHoverCard()
  const link = screen.getByRole('link', { name: /^Display Name/ })

  await user.hover(link)

  expect(screen.queryByText('Hover card content')).not.toBeInTheDocument()

  act(() => {
    vi.advanceTimersByTime(400)
  })

  expect(link).toHaveAccessibleDescription('Hover card content')
  await expectNoA11yViolations(container)
})

test('opens on focus and closes on Escape', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  renderHoverCard()

  await user.tab()
  act(() => {
    vi.advanceTimersByTime(0)
  })

  expect(screen.getByText('Hover card content')).toBeInTheDocument()

  await user.keyboard('{Escape}')

  expect(screen.queryByText('Hover card content')).not.toBeInTheDocument()
})

test('stays open while the pointer moves onto the card', async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  renderHoverCard()

  await user.hover(screen.getByRole('link'))
  act(() => {
    vi.advanceTimersByTime(400)
  })
  await user.hover(screen.getByText('Hover card content'))
  act(() => {
    vi.advanceTimersByTime(500)
  })

  expect(screen.getByText('Hover card content')).toBeInTheDocument()
})
