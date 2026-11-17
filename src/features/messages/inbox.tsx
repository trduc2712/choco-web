import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { Avatar } from '@/components/avatar/avatar'
import { Button } from '@/components/button/button'
import { EmptyState } from '@/components/empty-state/empty-state'
import type { HeadingLevel } from '@/components/heading/heading'
import { Heading } from '@/components/heading/heading'
import { SearchInput } from '@/components/search-input/search-input'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { messagesWithUserPath } from '@/constants/routes'
import { useUserSearch } from '@/features/user-search'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { getAvatarUrl } from '@/lib/avatar-url'
import { cx } from '@/lib/cx'

import { ConversationMenu } from './conversation-menu'
import styles from './inbox.module.scss'
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

function InboxRow({
  conversation,
  isActive,
  viewerId,
}: {
  conversation: Conversation
  isActive: boolean
  viewerId: string | undefined
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
    <li className={styles.item}>
      <Link
        to={messagesWithUserPath(otherUser.username)}
        state={{ skipHeadingFocus: true }}
        className={cx(styles.row, isUnread && styles.unread)}
        aria-current={isActive ? 'page' : undefined}
      >
        <Avatar
          name={name}
          src={getAvatarUrl(otherUser.avatarUrl)}
          fallback="person"
          size="md"
          shape="circle"
        />
        <span className={styles.body}>
          <Text as="span" size="sm" className={styles.name} isTruncated>
            {name}
          </Text>
          <span className={styles.line}>
            <Text
              as="span"
              size="xs"
              tone="muted"
              className={styles.excerpt}
              isTruncated
              dir="auto"
            >
              {excerpt}
            </Text>
            {date ? (
              <Text as="span" size="xs" tone="muted" className={styles.time}>
                <span aria-hidden="true">· </span>
                <time
                  dateTime={lastMessage!.createdAt}
                  title={formatFullDate(date, i18n.resolvedLanguage)}
                >
                  {formatInboxTime(date, i18n.resolvedLanguage)}
                </time>
              </Text>
            ) : null}
          </span>
        </span>
        {isUnread ? (
          <>
            <span aria-hidden="true" className={styles.dot} />
            <VisuallyHidden>
              {t('messages.unreadCount', { count: unreadCount })}
            </VisuallyHidden>
          </>
        ) : null}
      </Link>
      <ConversationMenu conversation={conversation} />
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
        className={styles.row}
        aria-current={isActive ? 'page' : undefined}
      >
        <Avatar
          name={name}
          src={getAvatarUrl(user.avatarUrl)}
          fallback="person"
          size="md"
          shape="circle"
        />
        <span className={styles.body}>
          <Text as="span" size="sm" className={styles.name} isTruncated>
            {name}
          </Text>
        </span>
      </Link>
    </li>
  )
}

export function InboxSkeletonRows({ count = 8 }: { count?: number }) {
  return (
    <ul className={styles.list} aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <li key={index}>
          <span className={styles.row}>
            <Skeleton
              shape="circle"
              width="var(--size-avatar-md)"
              height="var(--size-avatar-md)"
            />
            <span className={styles.body}>
              <Text as="span" size="sm">
                <Skeleton width="var(--space-9)" />
              </Text>
              <Text as="span" size="xs">
                <Skeleton width="var(--size-measure-sm)" />
              </Text>
            </span>
          </span>
        </li>
      ))}
    </ul>
  )
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
    <div className={styles.header}>
      <Heading level={headingLevel} size="xl" className={styles.title}>
        {t('messages.title')}
      </Heading>
      <SearchInput
        className={styles.search}
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
    <div className={styles.results}>
      {found.length > 0 ? (
        <section>
          <Heading
            level={sectionLevel}
            size="sm"
            tone="muted"
            className={styles.section}
          >
            {t('messages.search.conversations')}
          </Heading>
          <ul className={styles.list}>
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
          <Heading
            level={sectionLevel}
            size="sm"
            tone="muted"
            className={styles.section}
          >
            {t('messages.search.people')}
          </Heading>
          <ul className={styles.list}>
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
          <VisuallyHidden>{t('messages.search.searching')}</VisuallyHidden>
          <InboxSkeletonRows count={found.length > 0 ? 1 : 3} />
        </div>
      ) : found.length === 0 && others.length === 0 ? (
        <Text
          size="sm"
          tone="muted"
          align="center"
          role="status"
          className={styles.noResults}
        >
          {t('messages.search.empty', { query })}
        </Text>
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
    <div className={styles.scroller}>
      <InboxHeader
        headingLevel={headingLevel}
        query={search}
        onQueryChange={setSearch}
      />
      <nav
        className={styles.conversations}
        aria-label={t('messages.inboxLabel')}
      >
        {searchTerm ? (
          <SearchResults
            query={searchTerm}
            conversations={conversations}
            activeUsername={active}
            headingLevel={headingLevel}
          />
        ) : query.isPending ? (
          <div role="status">
            <VisuallyHidden>{t('messages.loading')}</VisuallyHidden>
            <InboxSkeletonRows />
          </div>
        ) : query.isError && !query.data ? (
          <EmptyState
            size="sm"
            role="alert"
            icon="alert-circle"
            headingLevel={stateLevel}
            title={t('messages.loadError')}
            action={
              <Button
                variant="secondary"
                isLoading={query.isFetching}
                onClick={() => void query.refetch()}
              >
                {t('common.retry')}
              </Button>
            }
          />
        ) : conversations.length === 0 ? (
          <EmptyState
            className={styles.empty}
            size="sm"
            icon="messages"
            headingLevel={stateLevel}
            title={t('messages.empty')}
            description={t('messages.emptyHint')}
          />
        ) : (
          <>
            <ul className={styles.list}>
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
              <div ref={sentinelRef} className={styles.more}>
                {query.isFetchNextPageError ? (
                  <>
                    <Text size="xs" tone="danger" role="alert">
                      {t('messages.loadMoreError')}
                    </Text>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void query.fetchNextPage()}
                    >
                      {t('common.retry')}
                    </Button>
                  </>
                ) : query.isFetchingNextPage ? (
                  <div role="status">
                    <VisuallyHidden>{t('messages.loading')}</VisuallyHidden>
                    <InboxSkeletonRows count={2} />
                  </div>
                ) : !isAutomatic ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void query.fetchNextPage()}
                  >
                    {t('messages.loadMore')}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </nav>
    </div>
  )
}
