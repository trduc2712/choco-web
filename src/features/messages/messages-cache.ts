import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query'

import type { PageResponse } from '@/lib/page-response'

import type { Timeline } from './message-store'
import { createTimeline } from './message-store'
import type { MessagingApi } from './messaging-api'
import type { Conversation, Message } from './messaging-types'

export const INBOX_LIMIT = 15
export const HISTORY_LIMIT = 30
export const CATCH_UP_LIMIT = 50

// Every key starts with the viewer's API id, so one account never reads
// another's cached conversations.
type Viewer = string

export const messagesKey = (viewerId: Viewer) => ['messages', viewerId] as const

export const inboxKey = (viewerId: Viewer) =>
  [...messagesKey(viewerId), 'inbox'] as const

export const timelinesKey = (viewerId: Viewer) =>
  [...messagesKey(viewerId), 'timeline'] as const

// A conversation is keyed by the other person: it may not exist yet.
export const timelineKey = (viewerId: Viewer, otherUserId: string) =>
  [...timelinesKey(viewerId), otherUserId] as const

export const messagingUserKey = (viewerId: Viewer, username: string) =>
  [...messagesKey(viewerId), 'user', username.toLowerCase()] as const

export type InboxData = InfiniteData<PageResponse<Conversation>, string | null>

export function inboxQueryOptions(api: MessagingApi, viewerId: Viewer) {
  return infiniteQueryOptions({
    queryKey: inboxKey(viewerId),
    queryFn: ({ pageParam, signal }) =>
      api.listConversations({ cursor: pageParam, limit: INBOX_LIMIT }, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  })
}

// Loaded once, then kept current by events, sends and catch-up. A refetch
// would drop older pages and unsent messages, so it never goes stale.
export function timelineQueryOptions(
  api: MessagingApi,
  viewerId: Viewer,
  otherUserId: string,
) {
  return queryOptions({
    queryKey: timelineKey(viewerId, otherUserId),
    queryFn: async ({ signal }): Promise<Timeline> => {
      const conversation = await api.getConversationByUser(otherUserId, signal)
      if (!conversation) return createTimeline(otherUserId)
      const page = await api.listMessages(
        conversation.id,
        { limit: HISTORY_LIMIT },
        signal,
      )
      return createTimeline(otherUserId, conversation, page)
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
}

export function messagingUserQueryOptions(
  api: MessagingApi,
  viewerId: Viewer,
  username: string,
) {
  return queryOptions({
    queryKey: messagingUserKey(viewerId, username),
    queryFn: ({ signal }) => api.getUserByUsername(username, signal),
    staleTime: 5 * 60_000,
  })
}

export function updateTimeline(
  queryClient: QueryClient,
  viewerId: Viewer,
  otherUserId: string,
  update: (timeline: Timeline) => Timeline,
) {
  queryClient.setQueryData<Timeline>(
    timelineKey(viewerId, otherUserId),
    (timeline) => (timeline ? update(timeline) : timeline),
  )
}

export function getTimeline(
  queryClient: QueryClient,
  viewerId: Viewer,
  otherUserId: string,
) {
  return queryClient.getQueryData<Timeline>(timelineKey(viewerId, otherUserId))
}

export function loadedTimelines(queryClient: QueryClient, viewerId: Viewer) {
  return queryClient
    .getQueriesData<Timeline>({ queryKey: timelinesKey(viewerId) })
    .flatMap(([, timeline]) => (timeline ? [timeline] : []))
}

// The loaded timeline a message belongs to. A conversation that didn't exist
// when its timeline loaded is matched by the other person, who sent it.
export function timelineForMessage(
  queryClient: QueryClient,
  viewerId: Viewer,
  message: Message,
) {
  const timelines = loadedTimelines(queryClient, viewerId)
  const inbox = queryClient.getQueryData<InboxData>(inboxKey(viewerId))
  const inboxOtherUserId =
    inbox && findInInbox(inbox, message.conversationId)?.otherUser.id
  return (
    timelines.find((item) => item.conversationId === message.conversationId) ??
    timelines.find(
      (item) =>
        item.conversationId === null &&
        (message.senderId === viewerId
          ? item.pending.some(
              (pending) => pending.clientMessageId === message.clientMessageId,
            ) || item.otherUserId === inboxOtherUserId
          : item.otherUserId === message.senderId),
    )
  )
}

function findInInbox(data: InboxData | undefined, conversationId: string) {
  if (!data) return undefined
  for (const page of data.pages) {
    const found = page.items.find((item) => item.id === conversationId)
    if (found) return found
  }
  return undefined
}

export function inboxPreviewSequence(
  queryClient: QueryClient,
  viewerId: Viewer,
  conversationId: string,
) {
  const data = queryClient.getQueryData<InboxData>(inboxKey(viewerId))
  return findInInbox(data, conversationId)?.lastMessage?.sequence ?? 0
}

export type InboxResult = 'updated' | 'unchanged' | 'missing'

// A new message moves its conversation to the top of the inbox. Returns
// 'missing' when that conversation isn't loaded, so the caller refreshes.
export function receiveInInbox(
  queryClient: QueryClient,
  viewerId: Viewer,
  message: Message,
): InboxResult {
  const data = queryClient.getQueryData<InboxData>(inboxKey(viewerId))
  if (!data) return 'missing'
  const conversation = findInInbox(data, message.conversationId)
  if (!conversation) return 'missing'

  const last = conversation.lastMessage?.sequence ?? 0
  const newest = Math.max(last, message.sequence)
  // Sending advances the sender's server read position, including when that
  // event comes from another tab or arrives after a newer incoming message.
  const lastReadSequence =
    message.senderId === viewerId
      ? Math.max(conversation.lastReadSequence, message.sequence)
      : conversation.lastReadSequence
  const newPreview = message.sequence > last
  if (!newPreview && lastReadSequence === conversation.lastReadSequence)
    return 'unchanged'
  const updated: Conversation = {
    ...conversation,
    lastMessage: newPreview ? message : conversation.lastMessage,
    lastReadSequence,
    unreadCount: Math.max(0, newest - lastReadSequence),
  }

  queryClient.setQueryData<InboxData>(inboxKey(viewerId), (current) => {
    if (!current) return current
    if (!newPreview) {
      return {
        ...current,
        pages: current.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.id === conversation.id ? updated : item,
          ),
        })),
      }
    }
    const pages = current.pages.map((page) => ({
      ...page,
      items: page.items.filter((item) => item.id !== conversation.id),
    }))
    const [first, ...rest] = pages
    return {
      ...current,
      pages: [{ ...first, items: [updated, ...first.items] }, ...rest],
    }
  })
  // Skipped messages may have changed the unread count; ask the server.
  return message.sequence > last + 1 ? 'missing' : 'updated'
}

export function setInboxRead(
  queryClient: QueryClient,
  viewerId: Viewer,
  conversationId: string,
  sequence: number,
) {
  queryClient.setQueryData<InboxData>(inboxKey(viewerId), (data) => {
    if (!data || !findInInbox(data, conversationId)) return data
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.id === conversationId && sequence > item.lastReadSequence
            ? {
                ...item,
                lastReadSequence: sequence,
                unreadCount: Math.max(
                  0,
                  (item.lastMessage?.sequence ?? 0) - sequence,
                ),
              }
            : item,
        ),
      })),
    }
  })
}

// Conversations with something unread, across the loaded inbox pages.
export function countUnreadConversations(data: InboxData | undefined) {
  if (!data) return 0
  const ids = new Set<string>()
  for (const page of data.pages) {
    for (const item of page.items) {
      if (item.unreadCount > 0) ids.add(item.id)
    }
  }
  return ids.size
}
