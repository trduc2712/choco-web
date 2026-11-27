import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Heading } from '@/components/heading/heading'

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
        <Heading level={1} size="xl">
          {t(`admin.screens.${screen}`)}
        </Heading>
        {actions ? <div>{actions}</div> : null}
      </div>
    </header>
  )
}
