// Direct messages as returned by choco-api.

export type MessagingUser = {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export type Message = {
  id: string
  conversationId: string
  // Grows by exactly 1 per message inside a conversation. The only order.
  sequence: number
  clientMessageId: string
  senderId: string
  content: string
  // ISO 8601, UTC. Shown, never used to order.
  createdAt: string
}

export type Conversation = {
  id: string
  otherUser: MessagingUser
  lastMessage: Message | null
  isBlockedByMe: boolean
  unreadCount: number
  // The viewer's own read position.
  lastReadSequence: number
}

export const MESSAGE_MAX_LENGTH = 2000

// Leading and trailing whitespace never counts and is never sent.
export function normalizeContent(content: string) {
  return content.trim()
}
