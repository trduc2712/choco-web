import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { SearchInput } from '@/components/search-input/search-input'
import { messagesWithUserPath } from '@/constants/routes'
import { useUserSearch } from '@/features/user-search'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { getAvatarUrl } from '@/lib/avatar-url'
import { cx } from '@/lib/cx'
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

import { ConversationMenu } from './conversation-menu'
import { displayName, formatFullDate, formatInboxTime } from './message-format'
import { useMessaging } from './messaging-context'
import type { Conversation, MessagingUser } from './messaging-types'
import { useInbox } from './use-messages'

const SEARCH_DEBOUNCE_MS = 250

function useDebouncedValue(value: string) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [value])
  return debounced
}

function matches(user: MessagingUser, query: string) {
  const wanted = query.toLocaleLowerCase()
  return (
    user.displayName.toLocaleLowerCase().includes(wanted) ||
    user.username.toLocaleLowerCase().includes(wanted)
  )
}

export function InboxRow({
  conversation,
  isActive,
  viewerId,
  hasMenu = true,
}: {
  conversation: Conversation
  isActive: boolean
  viewerId: string | undefined
  // The "…" menu; the header dropdown leaves it out.
  hasMenu?: boolean
}) {
  const { t, i18n } = useTranslation()
  const { otherUser, lastMessage, unreadCount } = conversation
  const name = displayName(otherUser)
  const isUnread = unreadCount > 0
  const date = lastMessage ? new Date(lastMessage.createdAt) : null
  const excerpt = lastMessage
    ? lastMessage.senderId === viewerId
      ? t('messages.fromYou', { text: lastMessage.content })
      : lastMessage.content
    : ''

  return (
    <li>
      <Link
        to={messagesWithUserPath(otherUser.username)}
        state={{ skipHeadingFocus: true }}
        className={cx('inbox-row', isUnread && 'inbox-unread')}
        aria-current={isActive ? 'page' : undefined}
      >
        <Avatar
          name={name}
          src={getAvatarUrl(otherUser.avatarUrl)}
          fallback="person"
        />
        <span>
          <span>{name}</span>
          <span>
            <span dir="auto">{excerpt}</span>
            {date ? (
              <span>
                <span aria-hidden="true">· </span>
                <time
                  dateTime={lastMessage!.createdAt}
                  title={formatFullDate(date, i18n.resolvedLanguage)}
                >
                  {formatInboxTime(date, i18n.resolvedLanguage)}
                </time>
              </span>
            ) : null}
          </span>
        </span>
        {isUnread ? (
          <>
            <span aria-hidden="true" />
            <span className="visually-hidden">
              {t('messages.unreadCount', { count: unreadCount })}
            </span>
          </>
        ) : null}
      </Link>
      {hasMenu ? <ConversationMenu conversation={conversation} /> : null}
    </li>
  )
}

function PersonRow({
  user,
  isActive,
}: {
  user: MessagingUser
  isActive: boolean
}) {
  const name = displayName(user)
  return (
    <li>
      <Link
        to={messagesWithUserPath(user.username)}
        state={{ skipHeadingFocus: true }}
        aria-current={isActive ? 'page' : undefined}
      >
        <Avatar
          name={name}
          src={getAvatarUrl(user.avatarUrl)}
          fallback="person"
        />
        <span>
          <span>{name}</span>
        </span>
      </Link>
    </li>
  )
}

export function InboxSkeletonRows() {
  const { t } = useTranslation()
  return <span role="status">{t('messages.loading')}</span>
}

// The inbox's title and search field, also drawn while the page loads.
export function InboxHeader({
  headingLevel,
  query,
  onQueryChange,
}: {
  headingLevel: HeadingLevel
  query?: string
  onQueryChange?: (query: string) => void
}) {
  const { t } = useTranslation()
  return (
    <div>
      <div role="heading" aria-level={headingLevel}>
        {t('messages.title')}
      </div>
      <SearchInput
        label={t('messages.search.label')}
        isLabelHidden
        placeholder={t('messages.search.placeholder')}
        value={query}
        disabled={!onQueryChange}
        onChange={onQueryChange}
      />
    </div>
  )
}

// Conversations whose person matches, then other people to start one with.
function SearchResults({
  query,
  conversations,
  activeUsername,
  headingLevel,
}: {
  query: string
  conversations: Conversation[]
  activeUsername?: string
  headingLevel: HeadingLevel
}) {
  const { t } = useTranslation()
  const { viewerId } = useMessaging()
  const debounced = useDebouncedValue(query)
  const people = useUserSearch(debounced, debounced.length > 0)
  const found = conversations.filter((item) => matches(item.otherUser, query))
  const known = new Set(conversations.map((item) => item.otherUser.id))
  const others = (
    people.data?.pages.flatMap((page) => page.items) ?? []
  ).filter((user) => !known.has(user.id) && user.id !== viewerId)
  const sectionLevel = Math.min(headingLevel + 1, 6) as HeadingLevel
  const isSearching = people.isFetching || debounced !== query

  return (
    <div>
      {found.length > 0 ? (
        <section>
          <div role="heading" aria-level={sectionLevel}>
            {t('messages.search.conversations')}
          </div>
          <ul>
            {found.map((conversation) => (
              <InboxRow
                key={conversation.id}
                conversation={conversation}
                viewerId={viewerId}
                isActive={
                  conversation.otherUser.username.toLowerCase() ===
                  activeUsername
                }
              />
            ))}
          </ul>
        </section>
      ) : null}
      {others.length > 0 ? (
        <section>
          <div role="heading" aria-level={sectionLevel}>
            {t('messages.search.people')}
          </div>
          <ul>
            {others.map((user) => (
              <PersonRow
                key={user.id}
                user={user}
                isActive={user.username.toLowerCase() === activeUsername}
              />
            ))}
          </ul>
        </section>
      ) : null}
      {isSearching && others.length === 0 ? (
        <div role="status">
          <span className="visually-hidden">
            {t('messages.search.searching')}
          </span>
          <InboxSkeletonRows />
        </div>
      ) : found.length === 0 && others.length === 0 ? (
        <p role="status">{t('messages.search.empty', { query })}</p>
      ) : null}
    </div>
  )
}

// The conversation list: newest activity first, loading more as it scrolls.
export function Inbox({
  activeUsername,
  headingLevel,
}: {
  activeUsername?: string
  headingLevel: HeadingLevel
}) {
  const { t } = useTranslation()
  const { viewerId } = useMessaging()
  const query = useInbox()
  const [search, setSearch] = useState('')
  const searchTerm = search.trim().replace(/^@/, '').trimStart()
  const { sentinelRef, isAutomatic } = useInfiniteScroll({
    hasNextPage: query.hasNextPage,
    isFetching: query.isFetching,
    isPaused: query.isFetchNextPageError,
    onLoadMore: () => void query.fetchNextPage(),
  })
  const conversations = query.data?.pages.flatMap((page) => page.items) ?? []
  const active = activeUsername?.toLowerCase()
  const stateLevel = Math.min(headingLevel + 1, 6) as HeadingLevel

  return (
    <div className="inbox-scroller">
      <InboxHeader
        headingLevel={headingLevel}
        query={search}
        onQueryChange={setSearch}
      />
      <nav aria-label={t('messages.inboxLabel')}>
        {searchTerm ? (
          <SearchResults
            query={searchTerm}
            conversations={conversations}
            activeUsername={active}
            headingLevel={headingLevel}
          />
        ) : query.isPending ? (
          <div role="status">
            <span className="visually-hidden">{t('messages.loading')}</span>
            <InboxSkeletonRows />
          </div>
        ) : query.isError && !query.data ? (
          <section role="alert">
            <div role="heading" aria-level={stateLevel}>
              {t('messages.loadError')}
            </div>
            {
              <button
                type="button"
                aria-busy={query.isFetching || undefined}
                disabled={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {t('common.retry')}
              </button>
            }
          </section>
        ) : conversations.length === 0 ? (
          <section>
            <div role="heading" aria-level={stateLevel}>
              {t('messages.empty')}
            </div>
            <p>{t('messages.emptyHint')}</p>
          </section>
        ) : (
          <>
            <ul>
              {conversations.map((conversation) => (
                <InboxRow
                  key={conversation.id}
                  conversation={conversation}
                  viewerId={viewerId}
                  isActive={
                    conversation.otherUser.username.toLowerCase() === active
                  }
                />
              ))}
            </ul>
            {query.hasNextPage ? (
              <div ref={sentinelRef}>
                {query.isFetchNextPageError ? (
                  <>
                    <p role="alert">{t('messages.loadMoreError')}</p>
                    <button
                      type="button"
                      onClick={() => void query.fetchNextPage()}
                    >
                      {t('common.retry')}
                    </button>
                  </>
                ) : query.isFetchingNextPage ? (
                  <div role="status">
                    <span className="visually-hidden">
                      {t('messages.loading')}
                    </span>
                    <InboxSkeletonRows />
                  </div>
                ) : !isAutomatic ? (
                  <button
                    type="button"
                    onClick={() => void query.fetchNextPage()}
                  >
                    {t('messages.loadMore')}
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </nav>
    </div>
  )
}
