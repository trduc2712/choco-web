import { useLocation } from 'react-router'

import { MESSAGES_PATH } from '@/constants/routes'
import { MessagesScreenSkeleton } from '@/features/messages'

// The page's own shape while the session or the page loads: with a
// conversation open when the address names one.
export function MessagesPageFallback() {
  const { pathname } = useLocation()
  return (
    <MessagesScreenSkeleton
      isOpen={pathname.startsWith(`${MESSAGES_PATH}/@`)}
    />
  )
}
