import type { ReactNode } from 'react'

import { DocHeading } from './doc-heading'

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
    <section aria-labelledby={id}>
      <div>
        <DocHeading level={2} id={id}>
          {title}
        </DocHeading>
        {description && <p>{description}</p>}
      </div>
      {children}
    </section>
  )
}
