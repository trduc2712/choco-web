import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { expect, test } from 'vitest'

import { Portal } from '@/components/portal/portal'

test('renders its children into the document body', () => {
  const { container } = render(
    <div>
      <Portal>
        <p>Floating</p>
      </Portal>
    </div>,
  )

  expect(container).not.toHaveTextContent('Floating')
  expect(screen.getByText('Floating').parentElement).toBe(document.body)
})

test('renders into an explicit container', () => {
  const target = document.createElement('section')
  document.body.append(target)

  render(
    <Portal container={target}>
      <p>Floating</p>
    </Portal>,
  )

  expect(screen.getByText('Floating').parentElement).toBe(target)
  target.remove()
})

function InDialog() {
  const anchorRef = useRef<HTMLSpanElement>(null)

  return (
    <dialog open>
      <span ref={anchorRef}>Anchor</span>
      <Portal anchorRef={anchorRef}>
        <p>Floating</p>
      </Portal>
    </dialog>
  )
}

test('stays inside an open dialog so it is not inert', () => {
  render(<InDialog />)

  expect(screen.getByText('Floating').parentElement?.tagName).toBe('DIALOG')
})
