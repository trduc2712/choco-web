import type { PageResponse } from '@/lib/page-response'

import type { Conversation, Message, MessagingUser } from './messaging-types'

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting'

export type MessagingEvents = {
  // `messageReceived`: best effort, never replayed. Both participants get it,
  // so the sender's other tabs see their own messages arrive too.
  onMessage: (message: Message) => void
  // The connection came back after a drop; anything sent meanwhile is lost.
  onReconnected: () => void
  onStatusChange?: (status: ConnectionStatus) => void
}

// Everything the messaging UI asks of the server. Components never call
// fetch or SignalR; they go through this, so the mock and the real API swap by
// one flag (`VITE_MESSAGING_API`).
//
// Errors are `ApiError` from `@/lib/api-client` (status, `code`, `retryAfter`)
// or, for a network failure, whatever `fetch` throws.
export type MessagingApi = {
  // POST /users/{userId}/messages. Creates the conversation on the first
  // message. A reused clientMessageId returns the message already saved.
  sendMessage: (
    userId: string,
    body: { clientMessageId: string; content: string },
    signal?: AbortSignal,
  ) => Promise<Message>
  // GET /me/conversations, newest activity first.
  listConversations: (
    params: { cursor?: string | null; limit: number },
    signal?: AbortSignal,
  ) => Promise<PageResponse<Conversation>>
  // GET /me/conversations/by-user/{userId}; null for its 404 (none yet).
  getConversationByUser: (
    userId: string,
    signal?: AbortSignal,
  ) => Promise<Conversation | null>
  // GET /me/conversations/{id}/messages: newest first, the cursor goes older.
  listMessages: (
    conversationId: string,
    params: { cursor?: string | null; limit: number },
    signal?: AbortSignal,
  ) => Promise<PageResponse<Message>>
  // GET /me/conversations/{id}/messages?afterSequence=n: oldest first.
  listMessagesAfter: (
    conversationId: string,
    params:
      | { afterSequence: number; limit: number; cursor?: never }
      | { cursor: string; afterSequence?: never; limit?: never },
    signal?: AbortSignal,
  ) => Promise<PageResponse<Message>>
  // PUT /me/conversations/{id}/read.
  markRead: (conversationId: string, sequence: number) => Promise<void>
  // GET /users/by-username/{username}, the person a conversation route names.
  getUserByUsername: (
    username: string,
    signal?: AbortSignal,
  ) => Promise<MessagingUser>
  // Opens the real-time connection; the returned function closes it.
  connect: (events: MessagingEvents) => () => void
}
