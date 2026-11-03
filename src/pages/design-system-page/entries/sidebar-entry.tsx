import { useTranslation } from 'react-i18next'

import { Avatar, NavList, Sidebar, Stack, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'
import { useSampleNavSections } from './sample-nav-sections'

export function SidebarEntry() {
  const { t } = useTranslation('designSystem')
  const sections = useSampleNavSections()

  return (
    <ShowcaseSection title={t('sections.collapsed')}>
      <Specimen label="isCollapsible" isStretched>
        <div className={styles.sidebarFrame}>
          <Sidebar
            label={t('samples.workspace')}
            header={<Text weight="semibold">{t('samples.workspace')}</Text>}
            footer={
              <Stack direction="row" gap={2} align="center">
                <Avatar name={t('samples.personName')} size="sm" />
              </Stack>
            }
            isCollapsible
          >
            {({ isCollapsed }) => (
              <NavList
                label={t('samples.mainNav')}
                sections={sections}
                isCollapsed={isCollapsed}
              />
            )}
          </Sidebar>
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
