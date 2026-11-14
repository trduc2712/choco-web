import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { SearchInput } from '@/components/search-input/search-input'
import { Select } from '@/components/select/select'

import styles from './admin-toolbar.module.scss'

// How long typing has to pause before a search is applied.
const SEARCH_DELAY_MS = 350
// The Select needs a value for "no filter".
const ALL = 'all'

// The search and filters of an admin list, in a row above its table. They
// belong to the list, not to a column, so they are always in view and the ones
// in force stay on screen. The owner keeps their values (in the URL) and
// applies them; the toolbar only reports changes.
export function AdminToolbar({
  children,
  isFiltered,
  onReset,
}: {
  children: ReactNode
  // Whether anything is searched or filtered; shows Reset.
  isFiltered: boolean
  onReset: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className={styles.root} role="search">
      {children}
      {isFiltered ? (
        <Button
          className={styles.reset}
          variant="ghost"
          iconStart="close"
          onClick={onReset}
        >
          {t('admin.toolbar.reset')}
        </Button>
      ) : null}
    </div>
  )
}

// A search box. What is typed applies when typing pauses, on Enter, and when
// the box is cleared; a search changed from outside, such as Reset, sets the
// box too.
export function AdminSearchField({
  label,
  placeholder,
  value,
  maxLength,
  onChange,
}: {
  label: string
  placeholder?: string
  // The search in force.
  value: string
  // The longest search the API takes, so what is typed is what is applied.
  maxLength?: number
  onChange: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  const [seen, setSeen] = useState(value)

  // A change from outside replaces what is typed.
  if (value !== seen) {
    setSeen(value)
    setDraft(value)
  }

  useEffect(() => {
    if (draft.trim() === value.trim()) return
    const timer = setTimeout(() => onChange(draft), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [draft, value, onChange])

  return (
    <SearchInput
      className={styles.search}
      label={label}
      placeholder={placeholder}
      maxLength={maxLength}
      value={draft}
      onChange={setDraft}
      onSearch={(next) => {
        setDraft(next)
        onChange(next)
      }}
    />
  )
}

export type AdminFilterOption = { value: string; label: string }

// A filter on one property, with "All" for none.
export function AdminFilterField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  // The chosen option; undefined means no filter.
  value: string | undefined
  options: AdminFilterOption[]
  onChange: (value: string | undefined) => void
}) {
  const { t } = useTranslation()

  return (
    <Select
      className={styles.filter}
      label={label}
      value={value ?? ALL}
      options={[{ value: ALL, label: t('table.filterAll') }, ...options]}
      onChange={(next) => onChange(next === ALL ? undefined : next)}
    />
  )
}
