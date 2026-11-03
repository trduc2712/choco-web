import type { ReactNode, RefObject } from 'react'
import { useLayoutEffect, useState } from 'react'
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
    setTarget(container ?? getPortalContainer(anchorRef?.current))
  }, [anchorRef, container])

  return target ? createPortal(children, target) : null
}
