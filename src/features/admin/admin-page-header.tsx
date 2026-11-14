import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'

import styles from './admin-page-header.module.scss'
import type { AdminScreenId } from './admin-screens'

type AdminPageHeaderProps = {
  screen: AdminScreenId
  // Controls on the right: filters, buttons.
  actions?: ReactNode
}

// The top of every admin screen: its title and what you can do. Where you are
// is the current tab in the top bar.
export function AdminPageHeader({ screen, actions }: AdminPageHeaderProps) {
  const { t } = useTranslation()

  return (
    <header className={styles.root}>
      <div className={styles.row}>
        <Heading level={1} size="xl">
          {t(`admin.screens.${screen}`)}
        </Heading>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  )
}
