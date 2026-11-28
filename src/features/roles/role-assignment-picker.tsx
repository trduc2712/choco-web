import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Checkbox } from '@/components/checkbox/checkbox'
import { Input } from '@/components/input/input'
import { type UserSearchItem, useUserSearch } from '@/features/user-search'

export function RoleAssignmentPicker({
  selected,
  disabled,
  onChange,
}: {
  selected: UserSearchItem[]
  disabled: boolean
  onChange: (users: UserSearchItem[]) => void
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const searchText = useDeferredValue(query.trim())
  const search = useUserSearch(searchText, !disabled)
  const users = search.data?.pages.flatMap((page) => page.items) ?? []
  const selectedIds = new Set(selected.map(({ id }) => id))

  return (
    <section>
      <h3>{t('admin.roles.assign.title')}</h3>
      <Input
        label={t('admin.roles.assign.search')}
        isLabelHidden
        placeholder={t('admin.roles.assign.search')}
        value={query}
        readOnly={disabled}
        onChange={(event) => setQuery(event.target.value)}
      />
      {selected.length ? (
        <div>
          {selected.map((user) => (
            <button
              type="button"
              key={user.id}
              disabled={disabled}
              aria-label={t('admin.roles.assign.remove', {
                username: user.username,
              })}
              onClick={() =>
                onChange(selected.filter(({ id }) => id !== user.id))
              }
            >
              {user.username}
            </button>
          ))}
        </div>
      ) : null}
      {searchText && search.isPending && !disabled ? (
        <span aria-hidden="true">&hellip;</span>
      ) : null}
      {searchText && search.isError ? (
        <p role="alert">{t('admin.roles.assign.searchError')}</p>
      ) : null}
      {searchText && search.isSuccess && !users.length ? (
        <p>{t('admin.roles.assign.noUsers')}</p>
      ) : null}
      {searchText
        ? users.map((user) => (
            <Checkbox
              key={user.id}
              label={`${user.displayName} (@${user.username})`}
              checked={selectedIds.has(user.id)}
              disabled={disabled}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, user]
                    : selected.filter(({ id }) => id !== user.id),
                )
              }
            />
          ))
        : null}
      {searchText && search.hasNextPage ? (
        <button
          type="button"
          aria-busy={search.isFetchingNextPage || undefined}
          disabled={disabled || search.isFetchingNextPage}
          onClick={() => void search.fetchNextPage()}
        >
          {t('admin.roles.assign.more')}
        </button>
      ) : null}
      <p>{t('admin.roles.assign.hint')}</p>
    </section>
  )
}
