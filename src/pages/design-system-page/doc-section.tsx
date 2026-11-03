import type { ReactNode } from 'react'

import { DocHeading } from './doc-heading'
import styles from './doc-section.module.scss'

type DocSectionProps = {
  id: string
  title: string
  description?: string
  children: ReactNode
}

export function DocSection({
  id,
  title,
  description,
  children,
}: DocSectionProps) {
  return (
    <section className={styles.root} aria-labelledby={id}>
      <div className={styles.header}>
        <DocHeading level={2} id={id}>
          {title}
        </DocHeading>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {children}
    </section>
  )
}
