import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Checkbox } from '@/components/checkbox/checkbox'
import { Input } from '@/components/input/input'
import { Skeleton } from '@/components/skeleton/skeleton'
import { type UserSearchItem, useUserSearch } from '@/features/user-search'

import styles from './roles.module.scss'

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
    <section className={styles.panel}>
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
        <div className={styles.templateButtons}>
          {selected.map((user) => (
            <Button
              key={user.id}
              size="sm"
              variant="secondary"
              iconEnd="close"
              disabled={disabled}
              aria-label={t('admin.roles.assign.remove', {
                username: user.username,
              })}
              onClick={() =>
                onChange(selected.filter(({ id }) => id !== user.id))
              }
            >
              {user.username}
            </Button>
          ))}
        </div>
      ) : null}
      {searchText && search.isPending && !disabled ? (
        <Skeleton lines={2} />
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
        <Button
          size="sm"
          variant="secondary"
          isLoading={search.isFetchingNextPage}
          disabled={disabled}
          onClick={() => void search.fetchNextPage()}
        >
          {t('admin.roles.assign.more')}
        </Button>
      ) : null}
      <p className={styles.muted}>{t('admin.roles.assign.hint')}</p>
    </section>
  )
}
