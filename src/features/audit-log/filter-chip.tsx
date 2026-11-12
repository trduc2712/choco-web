import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { Popover } from '@/components/popover/popover'
import { cx } from '@/lib/cx'

import styles from './filter-chip.module.scss'

type FilterChipProps = {
  icon: IconName
  label: string
  // The chosen value; without one the chip is unselected.
  value?: string
  onClear: () => void
  // The content of the dropdown; call `close` once a choice is made.
  children: (close: () => void) => ReactNode
}

// A filter shown as a chip: "Action" with an arrow until a value is chosen,
// then "Action: PostDeleted" on the accent color with an x to remove it.
export function FilterChip({
  icon,
  label,
  value,
  onClear,
  children,
}: FilterChipProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const isSelected = value !== undefined

  return (
    <span className={cx(styles.chip, isSelected && styles.selected)}>
      <Popover
        label={label}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <button type="button" className={styles.trigger}>
            <Icon name={icon} size="sm" />
            {isSelected ? `${label}: ${value}` : label}
            {isSelected ? null : <Icon name="chevron-down" size="sm" />}
          </button>
        }
      >
        {children(() => setIsOpen(false))}
      </Popover>
      {isSelected ? (
        <button
          type="button"
          className={styles.clear}
          aria-label={t('admin.auditLog.removeFilter', { filter: label })}
          onClick={onClear}
        >
          <Icon name="close" size="sm" />
        </button>
      ) : null}
    </span>
  )
}

type FilterOptionsProps = {
  options: { value: string; label: string; icon?: IconName }[]
  value?: string
  onSelect: (value: string) => void
}

// A list of choices for the dropdown of a chip.
export function FilterOptions({
  options,
  value,
  onSelect,
}: FilterOptionsProps) {
  return (
    <ul className={styles.options}>
      {options.map((option) => (
        <li key={option.value}>
          <button
            type="button"
            className={styles.option}
            aria-pressed={option.value === value}
            onClick={() => onSelect(option.value)}
          >
            {option.icon ? <Icon name={option.icon} size="sm" /> : null}
            {option.label}
            {option.value === value ? (
              <Icon name="check" size="sm" className={styles.check} />
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  )
}
