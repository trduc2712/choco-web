import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ApiFetch } from '@/lib/api-client'
import { ApiError } from '@/lib/api-client'
import { createRealtimeHub } from '@/lib/realtime-hub'

import { createHttpMessagingApi } from './http-messaging-api'
import {
  addOlderPage,
  contiguousSequence,
  createTimeline,
} from './message-store'
import type { InboxData } from './messages-cache'
import {
  getTimeline,
  inboxKey,
  inboxQueryOptions,
  timelineKey,
  timelineQueryOptions,
} from './messages-cache'
import {
  applyServerMessage,
  catchUp,
  markConversationRead,
  resync,
  retryMessage,
  sendMessage,
} from './messages-sync'
import type { Conversation, Message } from './messaging-types'
import { createMockMessagingApi } from './mock/mock-messaging-api'

vi.mock('@/lib/realtime-hub', () => ({
  createRealtimeHub: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}))

const viewer = 'viewer'
const peer = {
  id: 'peer',
  username: 'peer',
  displayName: 'Peer',
  avatarUrl: null,
}
const inbox = '/me/conversations'
const history = inbox + '/thread/messages'
const lookup = inbox + '/by-user/peer'
const send = '/users/peer/messages'
const read = inbox + '/thread/read'

function message(
  sequence: number,
  senderId = peer.id,
  clientMessageId = 'client-' + sequence,
): Message {
  return {
    id: 'message-' + sequence,
    conversationId: 'thread',
    clientMessageId,
    content: 'Message ' + sequence,
    senderId,
    sequence,
    createdAt: '2026-01-01T00:00:00Z',
  }
}

function conversation(
  lastMessage: Message | null,
  unreadCount = 0,
): Conversation {
  return {
    id: 'thread',
    otherUser: peer,
    lastMessage,
    unreadCount,
    lastReadSequence: 0,
    isBlockedByMe: false,
  }
}

function setup(handler: (path: string, init?: RequestInit) => unknown) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const apiFetch = vi.fn(async (path: string, init?: RequestInit) =>
    handler(path, init),
  )
  const getToken = vi.fn(async () => 'clerk-session')
  const api = createHttpMessagingApi({
    apiFetch: apiFetch as ApiFetch,
    getToken,
  })
  const ctx = { api, queryClient, viewerId: viewer }
  return {
    ...ctx,
    apiFetch,
    getToken,
    timeline: () => getTimeline(queryClient, viewer, peer.id)!,
    setTimeline: (timeline: ReturnType<typeof createTimeline>) =>
      queryClient.setQueryData(timelineKey(viewer, peer.id), timeline),
    setInbox: (item: Conversation) =>
      queryClient.setQueryData<InboxData>(inboxKey(viewer), {
        pages: [{ items: [item], nextCursor: null }],
        pageParams: [null],
      }),
    inbox: () =>
      queryClient.getQueryData<InboxData>(inboxKey(viewer))!.pages[0].items[0],
    connect: () => {
      const disconnect = api.connect({
        onMessage: (item) => applyServerMessage(ctx, item),
        onReconnected: () => resync(ctx),
      })
      const hub = vi.mocked(createRealtimeHub).mock.lastCall![0]
      return { disconnect, hub }
    },
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('Direct Messages with the HTTP adapter', () => {
  it('loads the blocked conversation from both endpoints and prevents sending', async () => {
    const item = { ...conversation(message(1)), isBlockedByMe: true }
    const ctx = setup((path) => {
      if (path === inbox + '?limit=15')
        return { items: [item], nextCursor: null }
      if (path === lookup) return item
      if (path === history + '?limit=30')
        return { items: [message(1)], nextCursor: null }
      throw Error('Unexpected request: ' + path)
    })
    const list = await ctx.queryClient.fetchInfiniteQuery(
      inboxQueryOptions(ctx.api, viewer),
    )
    expect(list.pages[0].items).toEqual([item])
    const thread = await ctx.queryClient.fetchQuery(
      timelineQueryOptions(ctx.api, viewer, peer.id),
    )
    expect(thread.isBlockedByMe).toBe(true)
    expect(thread.messages).toEqual([message(1)])
    expect(sendMessage(ctx, peer.id, 'do not send')).toBeUndefined()
    expect(ctx.apiFetch).toHaveBeenCalledTimes(3)
  })

  it.each([true, false])(
    'reconciles the first send with SignalR (event first: %s)',
    async (eventFirst) => {
      const ctx = setup((path, init) => {
        expect(path).toBe(send)
        const body = JSON.parse(String(init?.body))
        expect(body).toEqual({
          clientMessageId: draftId,
          recipientId: peer.id,
          content: 'hello',
        })
        const item = message(1, viewer, body.clientMessageId)
        if (eventFirst) {
          deliver(item)
          expect(ctx.timeline().pending).toEqual([])
        }
        return item
      })
      ctx.setTimeline(createTimeline(peer.id))
      ctx.setInbox(conversation(null))
      const { disconnect, hub } = ctx.connect()
      const deliver = hub.events.messageReceived
      expect(hub.url).toBe('http://localhost:3000/hubs/messages')
      expect(await hub.getToken()).toBe('clerk-session')
      const draftId = sendMessage(ctx, peer.id, '  hello  ')!
      await vi.waitFor(() => expect(ctx.timeline().pending).toEqual([]))
      // A second event with the same sequence cannot add another message.
      deliver({ ...message(1, viewer, draftId), id: 'other-wire-id' })
      expect(ctx.timeline().messages).toEqual([message(1, viewer, draftId)])
      expect(ctx.inbox()).toMatchObject({
        unreadCount: 0,
        lastMessage: { sequence: 1 },
      })
      disconnect()
    },
  )

  it('retries a saved send whose response was lost with the original draft ID', async () => {
    const saved = new Map<string, Message>()
    const requests: string[] = []
    const ctx = setup((path, init) => {
      expect(path).toBe(send)
      const { clientMessageId } = JSON.parse(String(init?.body))
      requests.push(clientMessageId)
      if (!saved.has(clientMessageId)) {
        saved.set(
          clientMessageId,
          message(saved.size + 1, viewer, clientMessageId),
        )
        throw new TypeError('Lost response')
      }
      return saved.get(clientMessageId)
    })
    ctx.setTimeline(createTimeline(peer.id))
    const id = sendMessage(ctx, peer.id, 'hello')!
    await vi.waitFor(() =>
      expect(ctx.timeline().pending[0]?.status).toBe('failed'),
    )
    retryMessage(ctx, peer.id, id)
    await vi.waitFor(() =>
      expect(ctx.timeline().messages).toEqual([saved.get(id)]),
    )
    expect(requests).toEqual([id, id])
    expect(ctx.timeline().pending).toEqual([])
  })

  it('treats other send restrictions as non-retryable 403s', async () => {
    const item = conversation(message(1))
    const ctx = setup((path) => {
      if (path === lookup) return item
      throw new ApiError(403, { code: 'Permission.Denied' })
    })
    ctx.setTimeline(createTimeline(peer.id, item))
    const id = sendMessage(ctx, peer.id, 'hello')!
    await vi.waitFor(() =>
      expect(ctx.timeline().pending[0]).toMatchObject({
        status: 'failed',
        failure: { kind: 'forbidden' },
      }),
    )
    retryMessage(ctx, peer.id, id)
    expect(ctx.timeline().pending[0].status).toBe('failed')
    expect(
      ctx.apiFetch.mock.calls.filter(([path]) => path === send),
    ).toHaveLength(1)
  })

  it('catches a gap from the last contiguous sequence and leaves the older cursor independent', async () => {
    const cursor = 'after/5+'
    const ctx = setup((path) => {
      if (path === history + '?afterSequence=4&limit=50')
        return { items: [message(5)], nextCursor: cursor }
      if (path === history + '?cursor=after%2F5%2B')
        return { items: [message(6), message(7)], nextCursor: null }
      if (path === history + '?cursor=older&limit=30')
        return { items: [message(3), message(2), message(1)], nextCursor: null }
      throw Error('Unexpected request: ' + path)
    })
    ctx.setTimeline(
      createTimeline(peer.id, conversation(message(4)), {
        items: [message(4)],
        nextCursor: 'older',
      }),
    )
    ctx.setInbox(conversation(message(4)))
    const { disconnect, hub } = ctx.connect()
    hub.events.messageReceived(message(7))
    expect(contiguousSequence(ctx.timeline())).toBe(4)
    await vi.waitFor(() =>
      expect(ctx.timeline().messages.map((item) => item.sequence)).toEqual([
        4, 5, 6, 7,
      ]),
    )
    expect(ctx.timeline().olderCursor).toBe('older')
    expect(ctx.inbox().unreadCount).toBe(7)
    const older = await ctx.api.listMessages('thread', {
      cursor: ctx.timeline().olderCursor,
      limit: 30,
    })
    expect(
      addOlderPage(ctx.timeline(), older, viewer).messages.map(
        (item) => item.sequence,
      ),
    ).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(ctx.apiFetch.mock.calls.map(([path]) => path)).toEqual([
      history + '?afterSequence=4&limit=50',
      history + '?cursor=after%2F5%2B',
      history + '?cursor=older&limit=30',
    ])
    disconnect()
  })

  it('recovers an offline message when the hub reconnects to a previously empty thread', async () => {
    const ctx = setup((path) => {
      if (path === lookup) return conversation(message(1), 1)
      if (path === history + '?afterSequence=0&limit=50')
        return { items: [message(1)], nextCursor: null }
      throw Error('Unexpected request: ' + path)
    })
    ctx.setTimeline(createTimeline(peer.id))
    const { disconnect, hub } = ctx.connect()
    hub.onReconnected()
    await vi.waitFor(() =>
      expect(ctx.timeline().messages).toEqual([message(1)]),
    )
    expect(ctx.timeline().conversationId).toBe('thread')
    disconnect()
  })

  it('uses a late send from the viewer’s other tab to advance the read position without replacing a newer preview', () => {
    const ctx = setup(() => undefined)
    ctx.setTimeline(createTimeline(peer.id, conversation(null)))
    ctx.setInbox(conversation(null))
    const { disconnect, hub } = ctx.connect()
    hub.events.messageReceived(message(1))
    hub.events.messageReceived(message(3))
    expect(ctx.inbox().unreadCount).toBe(3)
    hub.events.messageReceived(message(2, viewer))
    hub.events.messageReceived(message(2, viewer))
    expect(ctx.timeline().lastReadSequence).toBe(2)
    expect(ctx.inbox()).toMatchObject({
      lastReadSequence: 2,
      unreadCount: 1,
      lastMessage: { sequence: 3 },
    })
    disconnect()
  })

  it('marks only the acknowledged sequence as read when another message arrives', async () => {
    let acknowledge!: () => void
    const firstRead = new Promise<void>((resolve) => {
      acknowledge = resolve
    })
    const ctx = setup((path, init) => {
      expect(path).toBe(read)
      expect(init?.method).toBe('PUT')
      return JSON.parse(String(init?.body)).sequence === 1
        ? firstRead
        : undefined
    })
    ctx.setTimeline(createTimeline(peer.id, conversation(null)))
    ctx.setInbox(conversation(null))
    const { disconnect, hub } = ctx.connect()
    hub.events.messageReceived(message(1))
    const marking = markConversationRead(ctx, peer.id, 'thread', 1)
    hub.events.messageReceived(message(2))
    hub.events.messageReceived(message(2))
    expect(ctx.inbox().unreadCount).toBe(2)
    acknowledge()
    await marking
    expect(ctx.inbox()).toMatchObject({
      lastReadSequence: 1,
      unreadCount: 1,
      lastMessage: { sequence: 2 },
    })
    await markConversationRead(ctx, peer.id, 'thread', 2)
    expect(ctx.inbox().unreadCount).toBe(0)
    hub.events.messageReceived(message(2))
    hub.events.messageReceived(message(3))
    expect(ctx.inbox()).toMatchObject({
      lastReadSequence: 2,
      unreadCount: 1,
      lastMessage: { sequence: 3 },
    })
    disconnect()
  })
})

it('keeps the mock inbox and catch-up working without HTTP', async () => {
  const api = createMockMessagingApi({ viewerId: viewer })
  api.mock.setSettings({ latencyMs: 0, isConnected: false })
  const queryClient = new QueryClient()
  const ctx = { api, viewerId: viewer, queryClient }
  const page = await api.listConversations({ limit: 15 })
  const item = page.items[0]
  const otherId = item.otherUser.id
  const initial = await queryClient.fetchQuery(
    timelineQueryOptions(api, viewer, otherId),
  )
  api.mock.receive(otherId, { content: 'offline mock message' })
  await catchUp(ctx, otherId)
  const updated = getTimeline(queryClient, viewer, otherId)!
  expect(updated.olderCursor).toBe(initial.olderCursor)
  expect(updated.messages.at(-1)?.content).toBe('offline mock message')
})
