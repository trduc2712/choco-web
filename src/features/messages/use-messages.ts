import { skipToken, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { addOlderPage, removePending } from './message-store'
import {
  countUnreadConversations,
  getTimeline,
  HISTORY_LIMIT,
  inboxKey,
  inboxQueryOptions,
  messagingUserQueryOptions,
  timelineQueryOptions,
  updateTimeline,
} from './messages-cache'
import {
  catchUp,
  markConversationRead,
  refreshConversationBlock,
  retryMessage,
  sendMessage,
} from './messages-sync'
import type { MessagingApi } from './messaging-api'
import { useMessagingSession } from './messaging-context'

// A placeholder for the key factories while the session isn't ready; the
// query is disabled then, so it never runs.
const NO_API = {} as MessagingApi
const NO_VIEWER = ''

export function useInbox() {
  const session = useMessagingSession()
  return useInfiniteQuery({
    ...inboxQueryOptions(
      session?.api ?? NO_API,
      session?.viewerId ?? NO_VIEWER,
    ),
    enabled: session !== null,
  })
}

// The badge on the Messages link: conversations with something unread.
export function useUnreadConversationCount() {
  const session = useMessagingSession()
  const { data } = useInfiniteQuery({
    ...inboxQueryOptions(
      session?.api ?? NO_API,
      session?.viewerId ?? NO_VIEWER,
    ),
    enabled: session !== null,
    select: countUnreadConversations,
  })
  return data ?? 0
}

export function useMessagingUser(username: string) {
  const session = useMessagingSession()
  return useQuery({
    ...messagingUserQueryOptions(
      session?.api ?? NO_API,
      session?.viewerId ?? NO_VIEWER,
      username,
    ),
    enabled: session !== null,
  })
}

export function useTimeline(otherUserId: string | undefined) {
  const session = useMessagingSession()
  const options = timelineQueryOptions(
    session?.api ?? NO_API,
    session?.viewerId ?? NO_VIEWER,
    otherUserId ?? NO_VIEWER,
  )
  const query = useQuery({
    ...options,
    queryFn: session && otherUserId ? options.queryFn : skipToken,
  })
  const isReady = query.data !== undefined
  useEffect(() => {
    if (!isReady || !session || !otherUserId) return
    void catchUp(session, otherUserId)
    void refreshConversationBlock(session, otherUserId)
  }, [isReady, session, otherUserId])
  return query
}

// Loads the page of history before the oldest loaded message.
export function useOlderMessages(otherUserId: string) {
  const session = useMessagingSession()
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  const loadOlder = useCallback(async () => {
    if (!session || state === 'loading') return
    const { api, viewerId, queryClient } = session
    const timeline = getTimeline(queryClient, viewerId, otherUserId)
    if (!timeline?.conversationId || timeline.olderCursor === null) return
    setState('loading')
    try {
      const page = await api.listMessages(timeline.conversationId, {
        cursor: timeline.olderCursor,
        limit: HISTORY_LIMIT,
      })
      updateTimeline(queryClient, viewerId, otherUserId, (current) =>
        current.olderCursor === timeline.olderCursor
          ? addOlderPage(current, page, viewerId)
          : current,
      )
      setState('idle')
    } catch {
      setState('error')
    }
  }, [otherUserId, session, state])

  return {
    loadOlder,
    isLoading: state === 'loading',
    isError: state === 'error',
  }
}

export function useConversationActions(otherUserId: string) {
  const session = useMessagingSession()
  return useMemo(
    () => ({
      send: (content: string) =>
        session ? sendMessage(session, otherUserId, content) : undefined,
      retry: (clientMessageId: string) => {
        if (session) retryMessage(session, otherUserId, clientMessageId)
      },
      discard: (clientMessageId: string) => {
        if (!session) return
        updateTimeline(
          session.queryClient,
          session.viewerId,
          otherUserId,
          (timeline) => removePending(timeline, clientMessageId),
        )
      },
      markRead: (conversationId: string, sequence: number) => {
        if (!session) return
        void markConversationRead(
          session,
          otherUserId,
          conversationId,
          sequence,
        )
      },
      refreshInbox: () => {
        if (!session) return
        void refreshConversationBlock(session, otherUserId)
        void session.queryClient.invalidateQueries({
          queryKey: inboxKey(session.viewerId),
        })
      },
    }),
    [otherUserId, session],
  )
}
