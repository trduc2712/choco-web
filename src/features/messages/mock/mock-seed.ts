import type { Message, MessagingUser } from '../messaging-types'

const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`

export const SEED_USERS: MessagingUser[] = [
  { id: uuid(1), username: 'mai', displayName: 'Mai Nguyen', avatarUrl: null },
  {
    id: uuid(2),
    username: 'kenji',
    displayName: 'Kenji Sato',
    avatarUrl: null,
  },
  {
    id: uuid(3),
    username: 'lena',
    displayName: 'Lena Fischer',
    avatarUrl: null,
  },
  {
    id: uuid(4),
    username: 'omar',
    displayName: 'Omar Haddad',
    avatarUrl: null,
  },
  {
    id: uuid(5),
    username: 'sofia',
    displayName: 'Sofia Rossi',
    avatarUrl: null,
  },
  { id: uuid(6), username: 'noah', displayName: 'Noah Kim', avatarUrl: null },
  ...Array.from({ length: 12 }, (_, index) => ({
    id: uuid(100 + index),
    username: `chocofan${index + 1}`,
    displayName: `Choco Fan ${index + 1}`,
    avatarUrl: null,
  })),
]

const LINES = [
  'Did you try the new dark chocolate bar?',
  'Not yet! Is it the 70% one?',
  'Yes, with sea salt. It is so good.',
  'I will grab one tomorrow.',
  'Let me know what you think 🍫',
  'Are we still on for Saturday?',
  'Of course. 10am at the usual place?',
  'Perfect, see you there.',
  'Here is the recipe I mentioned: https://example.com/recipes/brownies',
  'Thanks! Saving it.',
  'How was your week?',
  'Busy, but good. Yours?',
  'Same here. Finally some time to relax.',
  'Did you see the post about the tasting event?',
  'I did, it looks fun. Want to go together?',
]

const BURST = 8
const BURST_GAP_MS = 40_000

export type SeedConversation = {
  id: string
  otherUserId: string
  messages: Message[]
  lastReadSequence: number
}

function conversation(
  index: number,
  otherUserId: string,
  viewerId: string,
  count: number,
  // How long ago the newest message was sent.
  newestAgoMs: number,
  // Time between bursts of chat; inside a burst messages are seconds apart.
  spacingMs: number,
  unread: number,
  // Who sends each message, by its sequence.
  senderOf: (sequence: number) => 'me' | 'them' = (sequence) =>
    Math.floor(sequence / 3) % 2 === 0 ? 'them' : 'me',
): SeedConversation {
  const id = uuid(1000 + index)
  const now = Date.now()
  // Real chats come in bursts: a few messages close together, then a pause.
  const sentAt = (fromNewest: number) =>
    now -
    newestAgoMs -
    Math.floor(fromNewest / BURST) * spacingMs -
    (fromNewest % BURST) * BURST_GAP_MS
  const messages: Message[] = Array.from({ length: count }, (_, offset) => {
    const sequence = offset + 1
    const isUnread = sequence > count - unread
    return {
      id: uuid(10_000 + index * 1000 + sequence),
      conversationId: id,
      sequence,
      clientMessageId: uuid(50_000 + index * 1000 + sequence),
      senderId:
        isUnread || senderOf(sequence) === 'them' ? otherUserId : viewerId,
      content: LINES[(sequence + index) % LINES.length],
      createdAt: new Date(sentAt(count - sequence)).toISOString(),
    }
  })
  return { id, otherUserId, messages, lastReadSequence: count - unread }
}

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function seedConversations(viewerId: string): SeedConversation[] {
  const [mai, kenji, lena, omar, sofia, , ...fans] = SEED_USERS
  return [
    // Enough history for several pages, spread over four days.
    conversation(1, mai.id, viewerId, 120, 4 * MINUTE, 5 * HOUR, 3),
    conversation(2, kenji.id, viewerId, 6, 40 * MINUTE, 2 * MINUTE, 2),
    conversation(3, lena.id, viewerId, 3, 5 * HOUR, 3 * MINUTE, 0, (s) =>
      s === 3 ? 'me' : 'them',
    ),
    conversation(4, omar.id, viewerId, 9, DAY + 2 * HOUR, 7 * MINUTE, 0),
    conversation(5, sofia.id, viewerId, 4, 3 * DAY, 20 * MINUTE, 1),
    // Quiet conversations so the inbox has more than one page.
    ...fans.map((fan, index) =>
      conversation(10 + index, fan.id, viewerId, 2, (5 + index) * DAY, HOUR, 0),
    ),
  ]
}
