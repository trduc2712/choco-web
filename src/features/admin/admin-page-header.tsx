import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'
import { Text } from '@/components/text/text'

import styles from './admin-page-header.module.scss'
import type { AdminScreenId } from './admin-screens'

type AdminPageHeaderProps = {
  screen: AdminScreenId
  // One line under the title, such as "12 new · 48 total".
  summary?: ReactNode
  // Controls on the right: filters, buttons.
  actions?: ReactNode
}

// The top of every admin screen: what it is and what you can do. Where you are
// is the breadcrumb in the top bar.
export function AdminPageHeader({
  screen,
  summary,
  actions,
}: AdminPageHeaderProps) {
  const { t } = useTranslation()
  const title = t(`admin.screens.${screen}`)

  return (
    <header className={styles.root}>
      <div className={styles.row}>
        <div className={styles.text}>
          <Heading level={1} size="xl">
            {title}
          </Heading>
          {summary ? (
            <Text size="sm" tone="muted">
              {summary}
            </Text>
          ) : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </header>
  )
}
