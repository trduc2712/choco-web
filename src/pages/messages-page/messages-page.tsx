import { useParams } from 'react-router'

import { MessagesScreen } from '@/features/messages'

export function MessagesPage() {
  const { handle } = useParams()
  return <MessagesScreen handle={handle} />
}
