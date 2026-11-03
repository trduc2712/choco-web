import type { RefObject } from 'react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cx } from '@/lib/cx'

import styles from './table-of-contents.module.scss'

type TocItem = {
  id: string
  label: string
  level: number
}

type TableOfContentsProps = {
  contentRef: RefObject<HTMLElement | null>
  contentKey: string
}

function readItems(content: HTMLElement): TocItem[] {
  return [...content.querySelectorAll<HTMLElement>('[data-toc]')].map(
    (heading) => ({
      id: heading.id,
      label: heading.textContent ?? '',
      level: Number(heading.dataset.toc),
    }),
  )
}

export function TableOfContents({
  contentRef,
  contentKey,
}: TableOfContentsProps) {
  const { t } = useTranslation('designSystem')
  const [items, setItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>()

  useEffect(() => {
    const content = contentRef.current

    if (!content) {
      return
    }

    const nextItems = readItems(content)
    const headings = nextItems.flatMap(
      (item) => document.getElementById(item.id) ?? [],
    )
    const offset = headings[0]
      ? parseFloat(getComputedStyle(headings[0]).scrollMarginTop) + 1
      : 0
    function updateActive() {
      const { scrollHeight } = document.documentElement
      const isAtBottom =
        scrollHeight > window.innerHeight &&
        window.innerHeight + window.scrollY >= scrollHeight - 1
      const passed = headings.filter(
        (heading) => heading.getBoundingClientRect().top <= offset,
      )

      setActiveId(
        isAtBottom ? headings.at(-1)?.id : (passed.at(-1) ?? headings[0])?.id,
      )
    }

    setItems(nextItems)
    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })

    return () => window.removeEventListener('scroll', updateActive)
  }, [contentRef, contentKey])

  if (items.length === 0) {
    return null
  }

  return (
    <nav className={styles.root} aria-label={t('docs.onThisPage')}>
      <p className={styles.title}>{t('docs.onThisPage')}</p>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.id}>
            <a
              className={cx(
                styles.link,
                item.level > 2 && styles.nested,
                item.id === activeId && styles.active,
              )}
              href={`#${item.id}`}
              aria-current={item.id === activeId ? 'location' : undefined}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
