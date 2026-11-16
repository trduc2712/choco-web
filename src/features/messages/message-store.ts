import type { PageResponse } from '@/lib/page-response'

import type { Conversation, Message } from './messaging-types'
import type { SendFailure } from './send-failure'

// A message the viewer sent that the server hasn't confirmed. It is keyed by
// its clientMessageId, made once when Send is pressed and reused by every
// retry, so the server can't save it twice.
export type PendingMessage = {
  clientMessageId: string
  content: string
  createdAt: string
  status: 'sending' | 'failed'
  failure?: SendFailure
}

// One conversation as this client knows it. Pure data: every change below
// returns a new timeline (or the same one when nothing changed), so it lives in
// the query cache and is easy to test.
export type Timeline = {
  otherUserId: string
  // Null until the first message creates the conversation.
  conversationId: string | null
  // Confirmed messages, ascending by sequence, at most one per sequence.
  messages: Message[]
  pending: PendingMessage[]
  // Where older history continues; null once the oldest page is loaded.
  olderCursor: string | null
  isBlockedByMe: boolean
  lastReadSequence: number
}

export function createTimeline(
  otherUserId: string,
  conversation: Conversation | null = null,
  // The newest page of history, newest first, as the API returns it.
  firstPage?: PageResponse<Message>,
): Timeline {
  return {
    otherUserId,
    conversationId: conversation?.id ?? null,
    messages: mergeMessages([], firstPage?.items ?? []),
    pending: [],
    olderCursor: firstPage?.nextCursor ?? null,
    isBlockedByMe: conversation?.isBlockedByMe ?? false,
    lastReadSequence: conversation?.lastReadSequence ?? 0,
  }
}

// Union by conversation and sequence, ordered by sequence only (never createdAt). The same message can
// come from a send response, a real-time event and a catch-up page, in any
// order; it is kept once.
export function mergeMessages(existing: Message[], incoming: Message[]) {
  if (incoming.length === 0) return existing
  const key = (message: Message) =>
    `${message.conversationId}:${message.sequence}`
  const bySequence = new Map(existing.map((message) => [key(message), message]))
  let changed = false
  for (const message of incoming) {
    if (!bySequence.has(key(message))) {
      bySequence.set(key(message), message)
      changed = true
    }
  }
  if (!changed) return existing
  return [...bySequence.values()].sort((a, b) => a.sequence - b.sequence)
}

export function newestSequence(timeline: Timeline) {
  return timeline.messages.at(-1)?.sequence ?? 0
}

// The highest sequence up to which nothing is missing. With all history loaded
// it counts from 0; otherwise from just before the oldest loaded message.
export function contiguousSequence(timeline: Timeline) {
  const { messages } = timeline
  const first = messages[0]
  if (!first) return 0
  let through = timeline.olderCursor === null ? 0 : first.sequence - 1
  for (const { sequence } of messages) {
    if (sequence <= through) continue
    if (sequence !== through + 1) break
    through = sequence
  }
  return through
}

// The sequence to catch up after, when something is missing; otherwise null.
// A gap appears when a message arrives whose sequence is more than one past
// the last one known.
export function findGap(timeline: Timeline): number | null {
  const through = contiguousSequence(timeline)
  return through < newestSequence(timeline) ? through : null
}

// A server message: from the send response, a real-time event or catch-up.
// It replaces the pending copy with the same clientMessageId.
export function receiveMessages(
  timeline: Timeline,
  incoming: Message[],
  viewerId: string,
) {
  const ours = incoming.filter(
    (message) =>
      timeline.conversationId === null ||
      message.conversationId === timeline.conversationId,
  )
  const first = ours[0]
  if (!first) return timeline

  const sent = ours.filter((message) => message.senderId === viewerId)
  const confirmed = new Set(sent.map((message) => message.clientMessageId))
  const lastReadSequence = sent.reduce(
    (sequence, message) => Math.max(sequence, message.sequence),
    timeline.lastReadSequence,
  )
  const pending = timeline.pending.some((item) =>
    confirmed.has(item.clientMessageId),
  )
    ? timeline.pending.filter((item) => !confirmed.has(item.clientMessageId))
    : timeline.pending
  const messages = mergeMessages(timeline.messages, ours)

  if (
    messages === timeline.messages &&
    pending === timeline.pending &&
    lastReadSequence === timeline.lastReadSequence &&
    timeline.conversationId !== null
  ) {
    return timeline
  }
  return {
    ...timeline,
    conversationId: timeline.conversationId ?? first.conversationId,
    lastReadSequence,
    messages,
    pending,
  }
}

export function receiveMessage(
  timeline: Timeline,
  message: Message,
  viewerId: string,
) {
  return receiveMessages(timeline, [message], viewerId)
}

// An older page of history (newest first, as the API returns it).
export function addOlderPage(
  timeline: Timeline,
  page: PageResponse<Message>,
  viewerId: string,
) {
  return {
    ...receiveMessages(timeline, page.items, viewerId),
    olderCursor: page.nextCursor,
  }
}

export function addPending(timeline: Timeline, pending: PendingMessage) {
  if (
    timeline.pending.some(
      (item) => item.clientMessageId === pending.clientMessageId,
    ) ||
    timeline.messages.some(
      (message) => message.clientMessageId === pending.clientMessageId,
    )
  ) {
    return timeline
  }
  return { ...timeline, pending: [...timeline.pending, pending] }
}

function updatePending(
  timeline: Timeline,
  clientMessageId: string,
  update: (item: PendingMessage) => PendingMessage,
) {
  if (
    !timeline.pending.some((item) => item.clientMessageId === clientMessageId)
  )
    return timeline
  return {
    ...timeline,
    pending: timeline.pending.map((item) =>
      item.clientMessageId === clientMessageId ? update(item) : item,
    ),
  }
}

export function markSending(timeline: Timeline, clientMessageId: string) {
  return updatePending(timeline, clientMessageId, (item) => ({
    ...item,
    status: 'sending',
    failure: undefined,
  }))
}

export function markFailed(
  timeline: Timeline,
  clientMessageId: string,
  failure: SendFailure,
) {
  return updatePending(timeline, clientMessageId, (item) => ({
    ...item,
    status: 'failed',
    failure,
  }))
}

// Discards an unsent message. A confirmed one can't be removed this way.
export function removePending(timeline: Timeline, clientMessageId: string) {
  if (
    !timeline.pending.some((item) => item.clientMessageId === clientMessageId)
  )
    return timeline
  return {
    ...timeline,
    pending: timeline.pending.filter(
      (item) => item.clientMessageId !== clientMessageId,
    ),
  }
}

export function markReadLocally(timeline: Timeline, sequence: number) {
  if (sequence <= timeline.lastReadSequence) return timeline
  return { ...timeline, lastReadSequence: sequence }
}

export type TimelineEntry =
  | { kind: 'sent'; key: string; message: Message }
  | { kind: 'pending'; key: string; pending: PendingMessage }

// What the list shows: confirmed messages by sequence, then the unconfirmed
// ones in the order they were sent. The key is the clientMessageId, so a
// bubble keeps its place (and focus) when its message is confirmed.
export function timelineEntries(
  timeline: Timeline,
  viewerId: string,
): TimelineEntry[] {
  return [
    ...timeline.messages.map((message): TimelineEntry => ({
      kind: 'sent',
      key: message.senderId === viewerId ? message.clientMessageId : message.id,
      message,
    })),
    ...timeline.pending.map((pending): TimelineEntry => ({
      kind: 'pending',
      key: pending.clientMessageId,
      pending,
    })),
  ]
}
