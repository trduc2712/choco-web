import { env } from '@/config/env'
import type { ApiFetch } from '@/lib/api-client'
import { ApiError } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'
import { createRealtimeHub } from '@/lib/realtime-hub'

import type { MessagingApi } from './messaging-api'
import type { Conversation, Message, MessagingUser } from './messaging-types'

const HUB_URL = `${env.apiBaseUrl.origin}/hubs/messages`

function isMessage(value: unknown): value is Message {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'conversationId' in value &&
    typeof value.conversationId === 'string' &&
    'sequence' in value &&
    typeof value.sequence === 'number' &&
    Number.isSafeInteger(value.sequence) &&
    value.sequence > 0 &&
    'clientMessageId' in value &&
    typeof value.clientMessageId === 'string' &&
    'senderId' in value &&
    typeof value.senderId === 'string' &&
    'content' in value &&
    typeof value.content === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'string'
  )
}

function query(params: Record<string, string | number | null | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== null && value !== undefined) search.set(key, String(value))
  }
  return search.toString()
}

const id = encodeURIComponent

// The HTTP adapter for choco-api.
export function createHttpMessagingApi({
  apiFetch,
  getToken,
}: {
  apiFetch: ApiFetch
  getToken: () => Promise<string | null>
}): MessagingApi {
  return {
    sendMessage: (userId, body, signal) =>
      apiFetch<Message>(`/users/${id(userId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, recipientId: userId }),
        signal,
      }),
    listConversations: ({ cursor, limit }, signal) =>
      apiFetch<PageResponse<Conversation>>(
        `/me/conversations?${query({ cursor, limit })}`,
        { signal },
      ),
    getConversationByUser: async (userId, signal) => {
      try {
        return await apiFetch<Conversation>(
          `/me/conversations/by-user/${id(userId)}`,
          { signal },
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
    listMessages: (conversationId, { cursor, limit }, signal) =>
      apiFetch<PageResponse<Message>>(
        `/me/conversations/${id(conversationId)}/messages?${query({ cursor, limit })}`,
        { signal },
      ),
    listMessagesAfter: (
      conversationId,
      { afterSequence, cursor, limit },
      signal,
    ) =>
      apiFetch<PageResponse<Message>>(
        `/me/conversations/${id(conversationId)}/messages?${query({ afterSequence, cursor, limit })}`,
        { signal },
      ),
    markRead: (conversationId, sequence) =>
      apiFetch<void>(`/me/conversations/${id(conversationId)}/read`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sequence }),
      }),
    getUserByUsername: (username, signal) =>
      apiFetch<MessagingUser>(`/users/by-username/${id(username)}`, { signal }),
    connect: ({ onMessage, onReconnected, onStatusChange }) => {
      const hub = createRealtimeHub({
        url: HUB_URL,
        getToken,
        events: {
          messageReceived: (payload) => {
            if (isMessage(payload)) onMessage(payload)
          },
        },
        onReconnected,
        onReconnecting: () => onStatusChange?.('reconnecting'),
        onConnected: () => onStatusChange?.('connected'),
      })
      onStatusChange?.('connecting')
      hub.start()
      return () => hub.stop()
    },
  }
}
