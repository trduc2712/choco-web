import { type KeyboardEvent, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'

import { Button } from '@/components/button/button'
import { Input } from '@/components/input/input'
import { Spinner } from '@/components/spinner/spinner'
import { Text } from '@/components/text/text'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { USER_SEARCH_PATH, userProfilePath } from '@/constants/routes'
import { getAvatarUrl } from '@/lib/avatar-url'

import { useDebouncedQuery } from './use-debounced-query'
import styles from './user-search.module.scss'
import { isValidSearchQuery, useUserSuggestions } from './user-search-api'
import { UserSearchIdentity } from './user-search-identity'

export function UserSearchBox() {
  const { pathname, search } = useLocation()
  const submittedQuery =
    pathname === USER_SEARCH_PATH
      ? (new URLSearchParams(search).get('q') ?? '')
      : ''
  return <SearchBox key={pathname + search} initialQuery={submittedQuery} />
}

function SearchBox({ initialQuery }: { initialQuery: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(initialQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const q = value.trim()
  const isValid = isValidSearchQuery(q)
  const showSuggestions = isOpen && isValid
  const { isDebouncing, resetDebounce } = useDebouncedQuery(q, showSuggestions)
  const suggestions = useUserSuggestions(isDebouncing ? '' : q, showSuggestions)
  const matches = isDebouncing ? [] : (suggestions.data ?? [])
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
    if (event.key === 'Escape' && showSuggestions) {
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
      className={styles.searchBox}
      data-open={showSuggestions || undefined}
      role="search"
      aria-label={t('userSearch.label')}
      onSubmit={(event) => {
        event.preventDefault()
        if (!isValid) return
        closeSuggestions()
        void navigate(`${USER_SEARCH_PATH}?${new URLSearchParams({ q })}`)
      }}
    >
      <Input
        ref={inputRef}
        type="search"
        name="q"
        role="combobox"
        size="md"
        icon="search"
        label={t('userSearch.label')}
        placeholder={t('userSearch.placeholder')}
        isLabelHidden
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        value={value}
        error={q && !isValid ? t('userSearch.invalid') : undefined}
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
        trailing={
          value ? (
            <Button
              icon="close"
              size="sm"
              variant="ghost"
              aria-label={t('searchInput.clear')}
              onClick={() => {
                setValue('')
                resetDebounce()
                inputRef.current?.focus()
                closeSuggestions()
              }}
            />
          ) : undefined
        }
      />
      {showSuggestions ? (
        <div className={styles.popup}>
          {options.length > 0 ? (
            <ul
              className={styles.listbox}
              id={listId}
              role="listbox"
              aria-label={t('userSearch.suggestions')}
            >
              {options.map((user, index) => (
                <li
                  key={user.username}
                  id={`${listId}-${index}`}
                  className={styles.option}
                  role="option"
                  aria-selected={index === activeIndex}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={(event) =>
                    openProfile(user.username, event.detail > 0)
                  }
                >
                  <UserSearchIdentity
                    user={user}
                    isTruncated
                    avatarUrl={getAvatarUrl(user.avatarUrl)}
                  />
                </li>
              ))}
            </ul>
          ) : isEmpty ? (
            <div className={styles.popupEmpty} aria-hidden="true">
              <Text size="sm" weight="medium">
                {message}
              </Text>
              <Text size="xs" tone="muted">
                {emptyHint}
              </Text>
            </div>
          ) : (
            <div className={styles.popupStatus} aria-hidden="true">
              {isLoading ? (
                <Spinner size="sm" tone="primary" isDecorative />
              ) : null}
              <Text size="sm" tone="muted">
                {message}
              </Text>
            </div>
          )}
        </div>
      ) : null}
      <VisuallyHidden role="status">
        {showSuggestions && !isDebouncing ? announcement : null}
      </VisuallyHidden>
    </form>
  )
}
