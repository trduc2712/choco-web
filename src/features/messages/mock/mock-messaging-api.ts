import { ApiError } from '@/lib/api-client'
import type { PageResponse } from '@/lib/page-response'

import type { MessagingApi, MessagingEvents } from '../messaging-api'
import type { Conversation, Message, MessagingUser } from '../messaging-types'
import { MESSAGE_MAX_LENGTH, normalizeContent } from '../messaging-types'
import { RATE_LIMIT_CODE } from '../send-failure'
import { SEED_USERS, seedConversations } from './mock-seed'

// What every send answers, whatever the random failures say.
export type MockSendOutcome =
  'normal' | 'blocked' | 'suspended' | 'rateLimited' | 'notFound'

export type MockSettings = {
  // Base latency of every request; each one takes 50–150% of it.
  latencyMs: number
  // Share of sends that fail on the network before the server saves them.
  sendFailureRate: number
  // Share of sends the server saves but whose response is lost, so the
  // client sees a failure and its retry must not duplicate the message.
  lostResponseRate: number
  sendOutcome: MockSendOutcome
  retryAfterSeconds: number
  // Real-time delivery faults.
  duplicateEvents: boolean
  shuffleEvents: boolean
  dropEventRate: number
  isConnected: boolean
}

export type MockControls = {
  getSettings: () => MockSettings
  setSettings: (patch: Partial<MockSettings>) => void
  subscribe: (listener: () => void) => () => void
  // People the mock can message: the seed and anyone looked up since.
  getUsers: () => MessagingUser[]
  // A message arrives from `userId` (or, with `fromViewer`, from the viewer's
  // other device), delivered as a `messageReceived` event.
  receive: (
    userId: string,
    options?: { content?: string; fromViewer?: boolean },
  ) => void
}

export type MockMessagingApi = MessagingApi & { mock: MockControls }

export const DEFAULT_MOCK_SETTINGS: MockSettings = {
  latencyMs: 400,
  sendFailureRate: 0,
  lostResponseRate: 0,
  sendOutcome: 'normal',
  retryAfterSeconds: 10,
  duplicateEvents: false,
  shuffleEvents: false,
  dropEventRate: 0,
  isConnected: true,
}

// The real limit is about 30 messages per minute per user.
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

const INCOMING_LINES = [
  'Hey! Are you around?',
  'Just saw your post 😄',
  'Quick question about Saturday',
  'Check this out: https://example.com/chocolate',
  'Sounds good to me.',
  'Haha, true',
  'On my way!',
]

type StoredConversation = {
  id: string
  otherUserId: string
  messages: Message[]
  lastReadSequence: number
}

function networkError() {
  return new TypeError('Failed to fetch')
}

function abortError() {
  return new DOMException('The operation was aborted.', 'AbortError')
}

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError())
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(abortError())
      },
      { once: true },
    )
  })
}

const copy = <T>(value: T): T => structuredClone(value)

// An in-memory choco-api for messaging, with knobs for the hard cases. Its
// state lives as long as the tab; a reload starts from the seed again.
export function createMockMessagingApi({
  viewerId,
  lookupUser,
}: {
  // The signed-in user's API id: the sender of the viewer's messages.
  viewerId: string
  // Finds someone outside the seed (a real profile) by username.
  lookupUser?: (username: string) => Promise<MessagingUser>
}): MockMessagingApi {
  let settings: MockSettings = { ...DEFAULT_MOCK_SETTINGS }
  const settingsListeners = new Set<() => void>()
  const connections = new Set<MessagingEvents>()
  const users = new Map(SEED_USERS.map((user) => [user.id, user]))
  const conversations = new Map(
    seedConversations(viewerId).map((item) => [item.id, item]),
  )
  const sentAt: number[] = []

  const latency = (signal?: AbortSignal) =>
    wait(settings.latencyMs * (0.5 + Math.random()), signal)

  function notifySettings() {
    for (const listener of settingsListeners) listener()
  }

  function conversationWith(userId: string) {
    for (const item of conversations.values()) {
      if (item.otherUserId === userId) return item
    }
    return undefined
  }

  function toConversation(item: StoredConversation): Conversation {
    const otherUser = users.get(item.otherUserId)!
    return {
      id: item.id,
      otherUser: copy(otherUser),
      isBlockedByMe: false,
      lastMessage: copy(item.messages.at(-1) ?? null),
      unreadCount:
        (item.messages.at(-1)?.sequence ?? 0) - item.lastReadSequence,
      lastReadSequence: item.lastReadSequence,
    }
  }

  function append(
    item: StoredConversation,
    senderId: string,
    content: string,
    clientMessageId: string = crypto.randomUUID(),
  ): Message {
    const message: Message = {
      id: crypto.randomUUID(),
      conversationId: item.id,
      sequence: (item.messages.at(-1)?.sequence ?? 0) + 1,
      clientMessageId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
    }
    item.messages.push(message)
    if (senderId === viewerId) item.lastReadSequence = message.sequence
    return message
  }

  function ensureConversation(userId: string) {
    let item = conversationWith(userId)
    if (!item) {
      item = {
        id: crypto.randomUUID(),
        otherUserId: userId,
        messages: [],
        lastReadSequence: 0,
      }
      conversations.set(item.id, item)
    }
    return item
  }

  // Best effort, as the real hub: may drop, repeat or reorder.
  function emit(message: Message) {
    if (!settings.isConnected) return
    if (Math.random() < settings.dropEventRate) return
    const copies = settings.duplicateEvents ? 2 : 1
    for (let index = 0; index < copies; index += 1) {
      const delay = settings.shuffleEvents
        ? Math.random() * 2500
        : 30 + Math.random() * 120 + index * 60
      setTimeout(() => {
        if (!settings.isConnected) return
        for (const events of connections) events.onMessage(copy(message))
      }, delay)
    }
  }

  function checkRateLimit(now: number) {
    while (sentAt.length > 0 && now - sentAt[0] >= RATE_WINDOW_MS) {
      sentAt.shift()
    }
    if (sentAt.length >= RATE_LIMIT) {
      const seconds = Math.ceil((sentAt[0] + RATE_WINDOW_MS - now) / 1000)
      throw new ApiError(429, {
        code: RATE_LIMIT_CODE,
        retryAfter: String(Math.max(1, seconds)),
      })
    }
  }

  function forcedFailure(outcome: MockSendOutcome) {
    switch (outcome) {
      case 'blocked':
        return new ApiError(403, { code: 'UserBlock.Blocked' })
      case 'suspended':
        return new ApiError(403, {
          code: 'User.Suspended',
          suspension: {
            reason: 'Mock suspension',
            suspendedAt: new Date().toISOString(),
          },
        })
      case 'rateLimited':
        return new ApiError(429, {
          code: RATE_LIMIT_CODE,
          retryAfter: String(settings.retryAfterSeconds),
        })
      case 'notFound':
        return new ApiError(404, { code: 'User.NotFound' })
      default:
        return null
    }
  }

  const api: MessagingApi = {
    async sendMessage(userId, { clientMessageId, content }, signal) {
      await latency(signal)
      if (Math.random() < settings.sendFailureRate) throw networkError()

      const failure = forcedFailure(settings.sendOutcome)
      if (failure) throw failure
      if (!users.has(userId)) throw new ApiError(404, { code: 'User.NotFound' })

      const text = normalizeContent(content)
      if (text.length === 0 || text.length > MESSAGE_MAX_LENGTH) {
        throw new ApiError(400, {
          errors: { content: ['Message content is invalid.'] },
          errorCodes: {
            content: [
              text.length === 0
                ? 'Message.Content.Required'
                : 'Message.Content.TooLong',
            ],
          },
        })
      }

      const item = ensureConversation(userId)
      // The same clientMessageId returns the message already saved (200).
      const existing = item.messages.find(
        (message) =>
          message.senderId === viewerId &&
          message.clientMessageId === clientMessageId,
      )
      if (existing) return copy(existing)

      const now = Date.now()
      checkRateLimit(now)
      sentAt.push(now)

      const message = append(item, viewerId, text, clientMessageId)
      emit(message)

      if (Math.random() < settings.lostResponseRate) {
        await latency()
        throw networkError()
      }
      return copy(message)
    },

    async listConversations({ cursor, limit }, signal) {
      await latency(signal)
      const sorted = [...conversations.values()]
        .filter((item) => item.messages.length > 0)
        .sort((a, b) =>
          b.messages
            .at(-1)!
            .createdAt.localeCompare(a.messages.at(-1)!.createdAt),
        )
      const start = cursor ? Number(cursor) : 0
      const items = sorted.slice(start, start + limit).map(toConversation)
      const next = start + limit
      return { items, nextCursor: next < sorted.length ? String(next) : null }
    },

    async getConversationByUser(userId, signal) {
      await latency(signal)
      const item = conversationWith(userId)
      return item && item.messages.length > 0 ? toConversation(item) : null
    },

    async listMessages(conversationId, { cursor, limit }, signal) {
      await latency(signal)
      const item = conversations.get(conversationId)
      if (!item) throw new ApiError(404)
      const before = cursor ? Number(cursor) : Infinity
      const older = item.messages.filter((message) => message.sequence < before)
      const page = older.slice(-limit)
      const items: Message[] = copy(page).reverse()
      return {
        items,
        nextCursor:
          older.length > page.length ? String(page[0].sequence) : null,
      } satisfies PageResponse<Message>
    },

    async listMessagesAfter(conversationId, params, signal) {
      await latency(signal)
      const item = conversations.get(conversationId)
      if (!item) throw new ApiError(404)
      const { cursor, limit = 20, afterSequence } = params
      const after = cursor === undefined ? afterSequence : Number(cursor)
      const newer = item.messages.filter((message) => message.sequence > after)
      const items = copy(newer.slice(0, limit))
      return {
        items,
        nextCursor:
          newer.length > items.length ? String(items.at(-1)!.sequence) : null,
      }
    },

    async markRead(conversationId, sequence) {
      await latency()
      const item = conversations.get(conversationId)
      if (!item) throw new ApiError(404)
      item.lastReadSequence = Math.max(item.lastReadSequence, sequence)
    },

    async getUserByUsername(username, signal) {
      await latency(signal)
      const wanted = username.toLowerCase()
      for (const user of users.values()) {
        if (user.username.toLowerCase() === wanted) return copy(user)
      }
      if (!lookupUser) throw new ApiError(404, { code: 'User.NotFound' })
      const user = await lookupUser(username)
      users.set(user.id, user)
      return copy(user)
    },

    connect(events) {
      connections.add(events)
      events.onStatusChange?.('connecting')
      const timer = setTimeout(() => {
        if (connections.has(events) && settings.isConnected) {
          events.onStatusChange?.('connected')
        }
      }, settings.latencyMs)
      return () => {
        clearTimeout(timer)
        connections.delete(events)
      }
    },
  }

  const mock: MockControls = {
    getSettings: () => settings,
    setSettings(patch) {
      const wasConnected = settings.isConnected
      settings = { ...settings, ...patch }
      notifySettings()
      if (wasConnected === settings.isConnected) return
      for (const events of connections) {
        if (settings.isConnected) {
          events.onStatusChange?.('connected')
          events.onReconnected()
        } else {
          events.onStatusChange?.('reconnecting')
        }
      }
    },
    subscribe(listener) {
      settingsListeners.add(listener)
      return () => settingsListeners.delete(listener)
    },
    getUsers: () => [...users.values()].map(copy),
    receive(userId, { content, fromViewer = false } = {}) {
      if (!users.has(userId)) return
      const item = ensureConversation(userId)
      const text =
        content ??
        INCOMING_LINES[Math.floor(Math.random() * INCOMING_LINES.length)]
      emit(append(item, fromViewer ? viewerId : userId, text))
    },
  }

  return { ...api, mock }
}

export function isMockMessagingApi(
  api: MessagingApi | null | undefined,
): api is MockMessagingApi {
  return api !== null && api !== undefined && 'mock' in api
}

// One mock per signed-in user for the life of the tab, so its data survives
// navigation and remounts.
const instances = new Map<string, MockMessagingApi>()

export function getMockMessagingApi(
  viewerId: string,
  lookupUser: (username: string) => Promise<MessagingUser>,
) {
  let instance = instances.get(viewerId)
  if (!instance) {
    instance = createMockMessagingApi({ viewerId, lookupUser })
    instances.set(viewerId, instance)
  }
  // The fault knobs, from the dev tools console: chocoMessagingMock.setSettings(
  // { sendFailureRate: 0.5 }), chocoMessagingMock.receive(userId), ...
  if (import.meta.env.DEV) {
    ;(window as { chocoMessagingMock?: MockControls }).chocoMessagingMock =
      instance.mock
  }
  return instance
}
