import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { cx } from '@/lib/cx'

export type TagTone = 'neutral' | 'primary'

export type TagProps = {
  label: string
  tone?: TagTone
  icon?: IconName
  onRemove?: () => void
  className?: string
}

export function Tag({
  label,
  tone = 'neutral',
  icon,
  onRemove,
  className,
}: TagProps) {
  const { t } = useTranslation()

  return (
    <span
      className={cx(
        'tag-root',
        tone === 'primary' && 'tag-primary',
        onRemove && 'tag-removable',
        className,
      )}
    >
      {icon && <Icon name={icon} size="sm" />}
      {label}
      {onRemove && (
        <button
          className="tag-remove"
          type="button"
          aria-label={t('tag.remove', { label })}
          onClick={onRemove}
        >
          <Icon name="close" size="sm" />
        </button>
      )}
    </span>
  )
}
