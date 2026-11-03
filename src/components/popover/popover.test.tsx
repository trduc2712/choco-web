import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Button } from '@/components/button/button'
import { Popover } from '@/components/popover/popover'
import { expectNoA11yViolations } from '@/test/a11y'

function renderPopover(onOpenChange = vi.fn()) {
  const view = render(
    <>
      <Popover
        title="Share"
        trigger={<Button>Share</Button>}
        onOpenChange={onOpenChange}
      >
        <Button variant="secondary">Copy link</Button>
      </Popover>
      <button type="button">Outside</button>
    </>,
  )

  return { ...view, trigger: screen.getByRole('button', { name: 'Share' }) }
}

test('is closed until its trigger is used', async () => {
  const { trigger, container } = renderPopover()

  expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
  expect(trigger).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('opens on click, is labelled by its title and focuses its content', async () => {
  const onOpenChange = vi.fn()
  const { trigger } = renderPopover(onOpenChange)

  await userEvent.click(trigger)

  const dialog = screen.getByRole('dialog', { name: 'Share' })

  expect(trigger).toHaveAttribute('aria-expanded', 'true')
  expect(trigger).toHaveAttribute('aria-controls', dialog.id)
  expect(screen.getByRole('button', { name: 'Copy link' })).toHaveFocus()
  expect(onOpenChange).toHaveBeenCalledWith(true)
  await expectNoA11yViolations(document.body)
})

test('closes on Escape and returns focus to the trigger', async () => {
  const { trigger } = renderPopover()

  await userEvent.click(trigger)
  await userEvent.keyboard('{Escape}')

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(trigger).toHaveFocus()
})

test('closes when clicking outside', async () => {
  const { trigger } = renderPopover()

  await userEvent.click(trigger)
  await userEvent.click(screen.getByRole('button', { name: 'Outside' }))

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('toggles closed from its trigger', async () => {
  const { trigger } = renderPopover()

  await userEvent.click(trigger)
  await userEvent.click(trigger)

  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('can be controlled', () => {
  render(
    <Popover isOpen label="Filters" trigger={<Button>Filters</Button>}>
      Content
    </Popover>,
  )

  expect(screen.getByRole('dialog', { name: 'Filters' })).toHaveTextContent(
    'Content',
  )
})
