import type { QueryClient } from '@tanstack/react-query'

import type { PageResponse } from '@/lib/page-response'

import {
  addPending,
  contiguousSequence,
  createTimeline,
  findGap,
  markFailed,
  markReadLocally,
  markSending,
  receiveMessage,
  receiveMessages,
} from './message-store'
import {
  CATCH_UP_LIMIT,
  getTimeline,
  inboxKey,
  inboxPreviewSequence,
  loadedTimelines,
  receiveInInbox,
  setInboxRead,
  timelineForMessage,
  updateTimeline,
} from './messages-cache'
import type { MessagingApi } from './messaging-api'
import type { Message } from './messaging-types'
import { normalizeContent } from './messaging-types'
import { canRetry, classifySendError } from './send-failure'

// Real-time events can arrive a little out of order; give a missing message
// this long to turn up before asking the server for it.
const GAP_GRACE_MS = 400
export const SEND_TIMEOUT_MS = 15_000

type Context = {
  queryClient: QueryClient
  api: MessagingApi
  viewerId: string
}

const catchUps = new Map<string, Promise<void>>()
const catchUpTimers = new Map<string, ReturnType<typeof setTimeout>>()

// Fetches every message after the last one known without a hole, page by page,
// until the server has no more.
export function catchUp(context: Context, otherUserId: string): Promise<void> {
  const key = `${context.viewerId}:${otherUserId}`
  const running = catchUps.get(key)
  if (running) {
    // One more pass after the current one, for what arrived meanwhile.
    const again = running.then(() => catchUp(context, otherUserId))
    return again
  }
  const task = runCatchUp(context, otherUserId).finally(() => {
    catchUps.delete(key)
  })
  catchUps.set(key, task)
  return task
}

async function runCatchUp(
  { queryClient, api, viewerId }: Context,
  otherUserId: string,
) {
  let timeline = getTimeline(queryClient, viewerId, otherUserId)
  if (!timeline) return
  if (!timeline.conversationId) {
    // A conversation may have been created while this empty thread was offline.
    const conversation = await api
      .getConversationByUser(otherUserId)
      .catch(() => null)
    if (!conversation) return
    updateTimeline(queryClient, viewerId, otherUserId, (current) =>
      current.conversationId
        ? current
        : {
            ...createTimeline(otherUserId, conversation),
            pending: current.pending,
          },
    )
    timeline = getTimeline(queryClient, viewerId, otherUserId)
  }
  if (!timeline?.conversationId) return

  const { conversationId } = timeline
  const afterSequence = contiguousSequence(timeline)
  let cursor: string | null = null
  let needsInboxRefresh = false
  do {
    const page: PageResponse<Message> | null = await api
      .listMessagesAfter(
        conversationId,
        cursor === null ? { afterSequence, limit: CATCH_UP_LIMIT } : { cursor },
      )
      .catch(() => null)
    if (!page) break
    updateTimeline(queryClient, viewerId, otherUserId, (current) =>
      receiveMessages(current, page.items, viewerId),
    )
    for (const message of page.items) {
      if (receiveInInbox(queryClient, viewerId, message) === 'missing') {
        needsInboxRefresh = true
      }
    }
    cursor = page.nextCursor
  } while (cursor !== null)
  if (needsInboxRefresh) {
    void queryClient.invalidateQueries({ queryKey: inboxKey(viewerId) })
  }
}

function scheduleCatchUp(context: Context, otherUserId: string) {
  const key = `${context.viewerId}:${otherUserId}`
  clearTimeout(catchUpTimers.get(key))
  catchUpTimers.set(
    key,
    setTimeout(() => {
      catchUpTimers.delete(key)
      const timeline = getTimeline(
        context.queryClient,
        context.viewerId,
        otherUserId,
      )
      if (timeline && findGap(timeline) !== null) {
        void catchUp(context, otherUserId)
      }
    }, GAP_GRACE_MS),
  )
}

// A message from the server, by any route: event, send response or retry.
export function applyServerMessage(context: Context, message: Message) {
  const { queryClient, viewerId } = context
  const timeline = timelineForMessage(queryClient, viewerId, message)
  if (timeline) {
    updateTimeline(queryClient, viewerId, timeline.otherUserId, (current) =>
      receiveMessage(current, message, viewerId),
    )
    const updated = getTimeline(queryClient, viewerId, timeline.otherUserId)
    if (updated && findGap(updated) !== null) {
      scheduleCatchUp(context, timeline.otherUserId)
    }
  }
  const result = receiveInInbox(queryClient, viewerId, message)
  const queryKey = inboxKey(viewerId)
  const isFetching = queryClient.isFetching({ queryKey, exact: true }) > 0
  if (result === 'missing' || (result === 'updated' && isFetching)) {
    void queryClient.invalidateQueries({ queryKey }).then(async () => {
      // In the initial fetch, invalidation joins the outstanding request. If
      // that snapshot predates this event, fetch once more now that it ended.
      if (
        isFetching &&
        inboxPreviewSequence(queryClient, viewerId, message.conversationId) <
          message.sequence
      ) {
        await queryClient.invalidateQueries({ queryKey })
      }
      // The first event from the viewer's other tab has no pending send to
      // identify its recipient. The refreshed inbox supplies that mapping.
      if (!timeline && message.senderId === viewerId) {
        const found = timelineForMessage(queryClient, viewerId, message)
        if (found) void catchUp(context, found.otherUserId)
      }
    })
  }
}

// After a reconnect (or a long absence) events may be lost: catch every loaded
// conversation up and refresh the inbox.
export function resync(context: Context) {
  for (const timeline of loadedTimelines(
    context.queryClient,
    context.viewerId,
  )) {
    void catchUp(context, timeline.otherUserId)
  }
  void context.queryClient.invalidateQueries({
    queryKey: inboxKey(context.viewerId),
  })
}

// Sends run one at a time per conversation, so they reach the server in the
// order they were written.
const sendQueues = new Map<string, Promise<void>>()

function enqueue(key: string, task: () => Promise<void>) {
  const previous = sendQueues.get(key) ?? Promise.resolve()
  const next = previous.then(task, task)
  sendQueues.set(key, next)
  void next.finally(() => {
    if (sendQueues.get(key) === next) sendQueues.delete(key)
  })
}

async function attemptSend(
  context: Context,
  otherUserId: string,
  clientMessageId: string,
  content: string,
) {
  const { queryClient, api, viewerId } = context
  const timeline = getTimeline(queryClient, viewerId, otherUserId)
  if (
    !timeline?.pending.some((item) => item.clientMessageId === clientMessageId)
  )
    return
  if (timeline.isBlockedByMe) {
    updateTimeline(queryClient, viewerId, otherUserId, (current) =>
      markFailed(current, clientMessageId, { kind: 'blocked' }),
    )
    return
  }
  updateTimeline(queryClient, viewerId, otherUserId, (timeline) =>
    markSending(timeline, clientMessageId),
  )
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS)
  try {
    const message = await api.sendMessage(
      otherUserId,
      { clientMessageId, content },
      controller.signal,
    )
    applyServerMessage(context, message)
  } catch (error) {
    const failure = classifySendError(error)
    if (failure.kind === 'blocked' || failure.kind === 'forbidden') {
      void refreshConversationBlock(context, otherUserId)
    }
    // If an event confirmed it meanwhile, it's no longer pending; this no-ops.
    updateTimeline(queryClient, viewerId, otherUserId, (timeline) =>
      markFailed(timeline, clientMessageId, failure),
    )
  } finally {
    clearTimeout(timer)
  }
}

// Shows the message at once as pending, then sends it. Its clientMessageId is
// made here, once, and every retry reuses it.
export function sendMessage(
  context: Context,
  otherUserId: string,
  rawContent: string,
) {
  const timeline = getTimeline(
    context.queryClient,
    context.viewerId,
    otherUserId,
  )
  if (!timeline || timeline.isBlockedByMe) return
  const content = normalizeContent(rawContent)
  const clientMessageId = crypto.randomUUID()
  updateTimeline(
    context.queryClient,
    context.viewerId,
    otherUserId,
    (timeline) =>
      addPending(timeline, {
        clientMessageId,
        content,
        createdAt: new Date().toISOString(),
        status: 'sending',
      }),
  )
  enqueue(`${context.viewerId}:${otherUserId}`, () =>
    attemptSend(context, otherUserId, clientMessageId, content),
  )
  return clientMessageId
}

// Safe to call any number of times: the server returns the saved message
// rather than a second copy.
export function retryMessage(
  context: Context,
  otherUserId: string,
  clientMessageId: string,
) {
  const timeline = getTimeline(
    context.queryClient,
    context.viewerId,
    otherUserId,
  )
  const pending = timeline?.pending.find(
    (item) => item.clientMessageId === clientMessageId,
  )
  if (
    !pending?.failure ||
    timeline?.isBlockedByMe ||
    !canRetry(pending.failure) ||
    (pending.failure.kind === 'rateLimited' &&
      pending.failure.retryAt > Date.now())
  )
    return
  updateTimeline(
    context.queryClient,
    context.viewerId,
    otherUserId,
    (current) => markSending(current, clientMessageId),
  )
  enqueue(`${context.viewerId}:${otherUserId}`, () =>
    attemptSend(context, otherUserId, clientMessageId, pending.content),
  )
}

// Keep the cached read position at the highest sequence acknowledged by the API.
export async function markConversationRead(
  context: Context,
  otherUserId: string,
  conversationId: string,
  sequence: number,
) {
  const { queryClient, api, viewerId } = context
  try {
    await api.markRead(conversationId, sequence)
  } catch {
    return
  }
  updateTimeline(queryClient, viewerId, otherUserId, (timeline) =>
    markReadLocally(timeline, sequence),
  )
  setInboxRead(queryClient, viewerId, conversationId, sequence)
  void queryClient.invalidateQueries({ queryKey: inboxKey(viewerId) })
}

export async function refreshConversationBlock(
  { api, queryClient, viewerId }: Context,
  otherUserId: string,
) {
  const conversation = await api
    .getConversationByUser(otherUserId)
    .catch(() => null)
  if (!conversation) return
  updateTimeline(queryClient, viewerId, otherUserId, (timeline) =>
    timeline.isBlockedByMe === conversation.isBlockedByMe
      ? timeline
      : { ...timeline, isBlockedByMe: conversation.isBlockedByMe },
  )
}
