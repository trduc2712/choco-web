import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

export type DescriptionListLayout = 'stacked' | 'inline'

export type DescriptionListItem = {
  id: string
  term: string
  description: ReactNode
}

export type DescriptionListProps = {
  items: DescriptionListItem[]
  layout?: DescriptionListLayout
  isDivided?: boolean
  className?: string
}

export function DescriptionList({
  items,
  layout = 'inline',
  isDivided = false,
  className,
}: DescriptionListProps) {
  return (
    <dl
      className={cx(
        'description-list-root',
        `description-list-${layout}`,
        isDivided && 'description-list-divided',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.id} className="description-list-item">
          <dt className="description-list-term">{item.term}</dt>
          <dd className="description-list-description">{item.description}</dd>
        </div>
      ))}
    </dl>
  )
}
