import { useTranslation } from 'react-i18next'

import { cx } from '@/lib/cx'

import styles from './skip-link.module.scss'

export type SkipLinkProps = {
  targetId: string
  label?: string
  className?: string
}

export function SkipLink({ targetId, label, className }: SkipLinkProps) {
  const { t } = useTranslation()

  return (
    <a
      className={cx(styles.root, className)}
      href={`#${targetId}`}
      onClick={(event) => {
        const target = document.getElementById(targetId)

        if (!target) {
          return
        }

        event.preventDefault()

        if (!target.hasAttribute('tabindex')) {
          target.setAttribute('tabindex', '-1')
        }

        target.focus()
        target.scrollIntoView?.()
      }}
    >
      {label ?? t('skipLink.label')}
    </a>
  )
}
