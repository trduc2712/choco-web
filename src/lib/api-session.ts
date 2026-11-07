import { createContext } from 'react'

export const ApiSessionEndedContext = createContext<
  ((sessionId: string) => void) | null
>(null)
