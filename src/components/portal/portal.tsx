import type { ReactNode, RefObject } from 'react'
import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { getPortalContainer } from './portal-container'

export type PortalProps = {
  children: ReactNode
  anchorRef?: RefObject<Element | null>
  container?: Element | null
}

export function Portal({ children, anchorRef, container }: PortalProps) {
  const [target, setTarget] = useState<Element | null>(container ?? null)

  useLayoutEffect(() => {
    // A parent's ref is attached after its children's layout effects run, so
    // a portal that mounts together with its anchor sees no anchor yet. The
    // effect below picks the container once the anchor is there.
    if (container || !anchorRef || anchorRef.current) {
      setTarget(container ?? getPortalContainer(anchorRef?.current))
    }
  }, [anchorRef, container])

  useEffect(() => {
    if (!container && anchorRef) {
      setTarget(getPortalContainer(anchorRef.current))
    }
  }, [anchorRef, container])

  return target ? createPortal(children, target) : null
}
