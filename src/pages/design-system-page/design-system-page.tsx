import type { MouseEvent } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useParams } from 'react-router'

import { Button, EmptyState, Link } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'
import { fallbackLanguage, i18n } from '@/i18n/i18n'
import designSystem from '@/i18n/locales/en/design-system.json'
import jaDesignSystem from '@/i18n/locales/ja/design-system.json'
import viDesignSystem from '@/i18n/locales/vi/design-system.json'

import { DesignSystemOverview } from './design-system-overview'
import styles from './design-system-page.module.scss'
import { DesignSystemSidebar } from './design-system-sidebar'
import { DocsHeader } from './docs-header'
import { EntryArticle } from './entry-article'
import { SearchDialog } from './search-dialog'
import { findEntry } from './showcase-entries'
import { TableOfContents } from './table-of-contents'

const NAMESPACE = 'designSystem'

i18n.addResourceBundle(fallbackLanguage, NAMESPACE, designSystem)
i18n.addResourceBundle(
  'ja',
  NAMESPACE,
  jaDesignSystem satisfies typeof designSystem,
)
i18n.addResourceBundle(
  'vi',
  NAMESPACE,
  viDesignSystem satisfies typeof designSystem,
)

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function DesignSystemPage() {
  const { t } = useTranslation(NAMESPACE)
  const { entryId } = useParams()
  const { pathname } = useLocation()
  const menuId = useId()
  const contentRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const drawerRef = useRef<HTMLDialogElement>(null)
  const previousPath = useRef(pathname)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const entry = findEntry(entryId)

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname
      titleRef.current?.focus({ preventScroll: true })
    }
  }, [pathname])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isShortcut =
        (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) ||
        (event.key === '/' && !isTypingTarget(event.target))

      if (isShortcut) {
        event.preventDefault()
        setIsSearchOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const drawer = drawerRef.current

    if (!drawer) {
      return
    }

    if (isMenuOpen && !drawer.open) {
      drawer.showModal()
    } else if (!isMenuOpen && drawer.open) {
      drawer.close()
    }
  }, [isMenuOpen])

  function closeMenu() {
    setIsMenuOpen(false)
  }

  function handleDrawerClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === drawerRef.current) {
      closeMenu()
    }
  }

  return (
    <div className={styles.page}>
      <DocsHeader
        menuId={menuId}
        isMenuOpen={isMenuOpen}
        onOpenMenu={() => setIsMenuOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <DesignSystemSidebar />
        </aside>
        <main ref={contentRef} className={styles.main}>
          <div className={styles.content}>
            {entryId === undefined ? (
              <DesignSystemOverview titleRef={titleRef} />
            ) : entry ? (
              <EntryArticle key={entry.id} entry={entry} titleRef={titleRef} />
            ) : (
              <EmptyState
                icon="search"
                headingLevel={1}
                title={t('notFound.title')}
                description={t('notFound.description')}
                action={
                  <Link to={DESIGN_SYSTEM_PATH}>{t('notFound.action')}</Link>
                }
              />
            )}
          </div>
        </main>
        <aside className={styles.toc}>
          {entry && (
            <TableOfContents contentRef={contentRef} contentKey={entry.id} />
          )}
        </aside>
      </div>
      <dialog
        ref={drawerRef}
        id={menuId}
        className={styles.drawer}
        aria-label={t('nav.label')}
        onClose={closeMenu}
        onClick={handleDrawerClick}
      >
        <div className={styles.drawerHeader}>
          <Button
            icon="close"
            variant="ghost"
            size="sm"
            aria-label={t('docs.closeMenu')}
            onClick={closeMenu}
          />
        </div>
        {isMenuOpen && <DesignSystemSidebar onNavigate={closeMenu} />}
      </dialog>
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  )
}
