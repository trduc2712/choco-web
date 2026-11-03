import type { ReactNode } from 'react'

import { cx } from '@/lib/cx'

import styles from './description-list.module.scss'

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
        styles.root,
        styles[layout],
        isDivided && styles.divided,
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.id} className={styles.item}>
          <dt className={styles.term}>{item.term}</dt>
          <dd className={styles.description}>{item.description}</dd>
        </div>
      ))}
    </dl>
  )
}
