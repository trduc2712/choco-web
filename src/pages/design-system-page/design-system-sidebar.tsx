import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router'

import { Icon } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'

import {
  getEntriesInGroup,
  getEntryPath,
  SHOWCASE_GROUPS,
} from './showcase-entries'

type DesignSystemSidebarProps = {
  onNavigate?: () => void
}

export function DesignSystemSidebar({ onNavigate }: DesignSystemSidebarProps) {
  const { t } = useTranslation('designSystem')
  const id = useId()

  return (
    <nav aria-label={t('nav.label')}>
      <NavLink to={DESIGN_SYSTEM_PATH} end onClick={onNavigate}>
        <Icon name="home" size="sm" />
        {t('docs.overview')}
      </NavLink>
      {SHOWCASE_GROUPS.map((group) => (
        <div key={group}>
          <p id={`${id}-${group}`}>{t(`groups.${group}`)}</p>
          <ul aria-labelledby={`${id}-${group}`}>
            {getEntriesInGroup(group).map((entry) => (
              <li key={entry.id}>
                <NavLink to={getEntryPath(entry.id)} onClick={onNavigate}>
                  {entry.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
