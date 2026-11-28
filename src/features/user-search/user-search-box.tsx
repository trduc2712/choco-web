import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { userProfilePath } from '@/constants/routes'
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll'
import { getAvatarUrl } from '@/lib/avatar-url'

import { useDebouncedQuery } from './use-debounced-query'
import { UserOptionSkeletons } from './user-row-skeletons'
import { isValidSearchQuery, useUserSearch } from './user-search-api'
import { UserSearchIdentity } from './user-search-identity'

export function UserSearchBox() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const listId = useId()
  const errorId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const q = value.trim()
  const isValid = isValidSearchQuery(q)
  const isInvalid = q !== '' && !isValid
  const showSuggestions = isOpen && isValid
  const { isDebouncing, resetDebounce } = useDebouncedQuery(q, showSuggestions)
  // The panel lists the first page of the people search and loads the next
  // pages as it scrolls, so it is the same list as the results page.
  const suggestions = useUserSearch(isDebouncing ? '' : q, showSuggestions)
  const matches = isDebouncing
    ? []
    : (suggestions.data?.pages.flatMap((page) => page.items) ?? [])
  const { fetchNextPage } = suggestions
  const loadMore = useCallback(
    () => void fetchNextPage({ cancelRefetch: false }),
    [fetchNextPage],
  )
  const { sentinelRef, isAutomatic } = useInfiniteScroll({
    hasNextPage: suggestions.hasNextPage,
    isFetching: suggestions.isFetching,
    isPaused: suggestions.isFetchNextPageError,
    onLoadMore: loadMore,
  })
  const options = showSuggestions ? matches : []
  const activeOption = options[activeIndex]
  const activeId = activeOption ? `${listId}-${activeIndex}` : undefined

  useEffect(() => {
    if (activeId)
      document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeId])

  function closeSuggestions() {
    setIsOpen(false)
    setActiveIndex(-1)
  }

  function openProfile(username: string, skipHeadingFocus = false) {
    closeSuggestions()
    setValue('')
    void navigate(userProfilePath(username), { state: { skipHeadingFocus } })
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (
      event.nativeEvent.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey
    )
      return
    if (event.key === 'Escape' && isOpen) {
      event.preventDefault()
      closeSuggestions()
    } else if (event.key === 'Enter' && activeOption) {
      event.preventDefault()
      openProfile(activeOption.username)
    } else if (
      (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
      isValid &&
      (!isOpen || options.length > 0)
    ) {
      event.preventDefault()
      setIsOpen(true)
      if (event.key === 'ArrowDown') {
        setActiveIndex(
          Math.min(activeIndex + 1, Math.max(matches.length - 1, 0)),
        )
      } else {
        setActiveIndex(
          activeOption ? Math.max(activeIndex - 1, 0) : matches.length - 1,
        )
      }
    }
  }

  const isLoading = isDebouncing || suggestions.isPending
  const isEmpty = !isLoading && !suggestions.isError && options.length === 0
  const emptyHint = t('userSearch.noSuggestionsHint')
  const message = isLoading
    ? t('userSearch.loadingSuggestions')
    : suggestions.isError
      ? t('userSearch.suggestionsError')
      : t('userSearch.noSuggestions')
  const announcement = options.length
    ? t('userSearch.suggestionsAvailable')
    : isEmpty
      ? `${message} ${emptyHint}`
      : message

  return (
    <form
      data-open={isOpen || undefined}
      role="search"
      aria-label={t('userSearch.label')}
      onSubmit={(event) => {
        event.preventDefault()
        // The results already show in the panel; Enter just skips the wait.
        if (isValid) resetDebounce()
      }}
    >
      <div>
        <div>
          {isOpen ? (
            <button
              type="button"
              aria-label={t('postDetail.back')}
              // Keeps focus in the input until the click closes the panel.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                closeSuggestions()
                inputRef.current?.blur()
              }}
            >
              {t('postDetail.back')}
            </button>
          ) : null}
          <div data-invalid={isInvalid || undefined}>
            <span aria-hidden="true">⚲</span>
            <input
              ref={inputRef}
              type="search"
              name="q"
              role="combobox"
              aria-label={t('userSearch.label')}
              placeholder={t('userSearch.placeholder')}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              enterKeyHint="search"
              value={value}
              aria-invalid={isInvalid || undefined}
              aria-errormessage={isInvalid ? errorId : undefined}
              aria-autocomplete="list"
              aria-expanded={options.length > 0}
              aria-controls={options.length > 0 ? listId : undefined}
              aria-activedescendant={activeId}
              onChange={(event) => {
                setValue(event.target.value)
                setIsOpen(true)
                setActiveIndex(-1)
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={closeSuggestions}
              onKeyDown={handleKeyDown}
            />
            {value ? (
              <button
                type="button"
                aria-label={t('searchInput.clear')}
                // Keeps focus in the input so the dropdown does not flicker shut.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setValue('')
                  resetDebounce()
                  inputRef.current?.focus()
                  closeSuggestions()
                }}
              >
                <span aria-hidden="true">×</span>
              </button>
            ) : null}
          </div>
        </div>
        {isInvalid ? (
          <div id={errorId} role="alert">
            {t('userSearch.invalid')}
          </div>
        ) : null}
        {isOpen ? (
          <div>
            {!isValid ? (
              <div>
                <span aria-hidden="true">⚲</span>
                <p>{t('userSearch.hint')}</p>
              </div>
            ) : options.length > 0 ? (
              <>
                <ul
                  id={listId}
                  role="listbox"
                  aria-label={t('userSearch.suggestions')}
                >
                  {options.map((user, index) => (
                    <li
                      key={user.username}
                      id={`${listId}-${index}`}
                      role="option"
                      aria-selected={index === activeIndex}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={(event) =>
                        openProfile(user.username, event.detail > 0)
                      }
                    >
                      <UserSearchIdentity
                        user={user}
                        avatarUrl={getAvatarUrl(user.avatarUrl)}
                      />
                    </li>
                  ))}
                </ul>
                {suggestions.hasNextPage ? (
                  <div
                    ref={sentinelRef}
                    className={
                      isAutomatic && !suggestions.isFetchNextPageError
                        ? undefined
                        : 'user-search-more'
                    }
                  >
                    {isAutomatic && !suggestions.isFetchNextPageError ? (
                      suggestions.isFetchingNextPage ? (
                        <UserOptionSkeletons />
                      ) : null
                    ) : (
                      <button
                        type="button"
                        aria-busy={suggestions.isFetchingNextPage || undefined}
                        disabled={suggestions.isFetchingNextPage}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={loadMore}
                      >
                        {t(
                          suggestions.isFetchNextPageError
                            ? 'common.retry'
                            : 'userSearch.loadMore',
                        )}
                      </button>
                    )}
                  </div>
                ) : null}
              </>
            ) : isEmpty ? (
              <div aria-hidden="true">
                <p>{message}</p>
                <p>{emptyHint}</p>
              </div>
            ) : isLoading ? (
              <UserOptionSkeletons />
            ) : (
              <div aria-hidden="true">
                <p>{message}</p>
              </div>
            )}
          </div>
        ) : null}
        <span className="visually-hidden" role="status">
          {showSuggestions && !isDebouncing ? announcement : null}
        </span>
      </div>
    </form>
  )
}
