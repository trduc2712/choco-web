import type { ReactNode } from 'react'
import { useId } from 'react'

import { Icon } from '@/components/icon/icon'
import { cx } from '@/lib/cx'

export type AccordionItem = {
  id: string
  title: string
  content: ReactNode
  isOpenByDefault?: boolean
}

export type AccordionProps = {
  items: AccordionItem[]
  isExclusive?: boolean
  className?: string
}

export function Accordion({
  items,
  isExclusive = false,
  className,
}: AccordionProps) {
  const groupName = useId()

  return (
    <div className={cx('accordion-root', className)}>
      {items.map((item) => (
        <details
          key={item.id}
          className="accordion-item"
          name={isExclusive ? groupName : undefined}
          open={item.isOpenByDefault}
        >
          <summary className="accordion-summary">
            {item.title}
            <Icon className="accordion-chevron" name="chevron-down" />
          </summary>
          <div className="accordion-content">{item.content}</div>
        </details>
      ))}
    </div>
  )
}
