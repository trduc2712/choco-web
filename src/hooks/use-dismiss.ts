import type { RefObject } from 'react'
import { useEffect, useRef } from 'react'

type DismissOptions = {
  isEnabled: boolean
  refs: RefObject<Element | null>[]
  onDismiss: (reason: 'escape' | 'outside') => void
}

export function useDismiss({ isEnabled, refs, onDismiss }: DismissOptions) {
  const latest = useRef({ refs, onDismiss })

  useEffect(() => {
    latest.current = { refs, onDismiss }
  })

  useEffect(() => {
    if (!isEnabled) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      const isInside = latest.current.refs.some(
        (ref) =>
          event.target instanceof Node && ref.current?.contains(event.target),
      )

      if (!isInside) {
        latest.current.onDismiss('outside')
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault()
        latest.current.onDismiss('escape')
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEnabled])
}
