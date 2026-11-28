import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

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
    <header>
      <div>
        <h1>{t(`admin.screens.${screen}`)}</h1>
        {actions ? <div>{actions}</div> : null}
      </div>
    </header>
  )
}
