import { useTranslation } from 'react-i18next'

import type { SelectSize } from '@/components/select/select'
import { Select } from '@/components/select/select'

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const

export type PageSizeSelectProps = {
  value: number
  onChange: (pageSize: number) => void
  options?: readonly number[]
  label?: string
  size?: SelectSize
  className?: string
}

export function PageSizeSelect({
  value,
  onChange,
  options = PAGE_SIZE_OPTIONS,
  label,
  size = 'sm',
  className,
}: PageSizeSelectProps) {
  const { t } = useTranslation()

  return (
    <Select
      label={label ?? t('pageSizeSelect.label')}
      isLabelHidden
      size={size}
      className={className}
      value={String(value)}
      options={options.map((option) => ({
        value: String(option),
        label: t('pageSizeSelect.option', { count: option }),
      }))}
      onChange={(next) => onChange(Number(next))}
    />
  )
}
