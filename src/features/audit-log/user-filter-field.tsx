import { useEffect, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Field } from '@/components/field/field'
import { Popover } from '@/components/popover/popover'
import { SearchInput } from '@/components/search-input/search-input'
import { useUserSearch } from '@/features/user-search'

type UserFilterFieldProps = {
  label: string
  // The name of the chosen user; undefined means no filter.
  value: string | undefined
  onSelect: (id: string, name: string) => void
  onClear: () => void
}

// A filter on one user. It looks like the toolbar's other filters, a labelled
// field showing "All" or the chosen user, and opens a search, since the API
// filters by id and there are too many users to list.
export function UserFilterField({
  label,
  value,
  onSelect,
  onClear,
}: UserFilterFieldProps) {
  const { t } = useTranslation()
  const id = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), 250)
    return () => clearTimeout(timer)
  }, [text])

  const results = useUserSearch(query)
  const users = results.data?.pages.flatMap((page) => page.items) ?? []

  function close() {
    setIsOpen(false)
    setText('')
  }

  return (
    <Field id={id} label={label}>
      <Popover
        label={label}
        isOpen={isOpen}
        onOpenChange={(next) => (next ? setIsOpen(true) : close())}
        trigger={
          <button type="button" id={id}>
            <span
              className={
                value ? 'user-filter-field-value' : 'user-filter-field-all'
              }
            >
              {value ?? t('table.filterAll')}
            </span>
            <span aria-hidden="true">⌄</span>
          </button>
        }
      >
        <div>
          <SearchInput
            label={t('admin.auditLog.actorSearch')}
            isLabelHidden
            placeholder={t('admin.auditLog.actorSearch')}
            value={text}
            onChange={setText}
          />
          <ul>
            {value ? (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onClear()
                    close()
                  }}
                >
                  {t('table.filterAll')}
                </button>
              </li>
            ) : null}
            {users.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  aria-pressed={user.username === value}
                  onClick={() => {
                    onSelect(user.id, user.username)
                    close()
                  }}
                >
                  {user.username}
                  {user.username === value ? (
                    <span aria-hidden="true">✓</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          {results.isFetching ? (
            <span role="status">{t('common.loading')}</span>
          ) : null}
          {query && results.isSuccess && users.length === 0 ? (
            <p>{t('admin.auditLog.noUsers')}</p>
          ) : null}
        </div>
      </Popover>
    </Field>
  )
}
