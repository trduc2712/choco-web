import { useTranslation } from 'react-i18next'

import type { SegmentedControlOption, SegmentedControlSize } from '@/components'
import { SegmentedControl, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const SIZES: SegmentedControlSize[] = ['sm', 'md']

export function SegmentedControlEntry() {
  const { t } = useTranslation('designSystem')
  const options: SegmentedControlOption[] = [
    { value: 'list', label: t('samples.viewList'), icon: 'layout-list' },
    { value: 'grid', label: t('samples.viewGrid'), icon: 'layout-grid' },
    { value: 'board', label: t('samples.viewBoard'), icon: 'kanban' },
  ]

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <Stack gap={5}>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <SegmentedControl
                label={t('samples.viewLabel')}
                options={options}
                size={size}
              />
            </Specimen>
          ))}
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.iconOnly')}>
        <Specimen label="isLabelHidden">
          <SegmentedControl
            label={t('samples.viewLabel')}
            options={options.map((option) => ({
              ...option,
              isLabelHidden: true,
            }))}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.fullWidth')}>
        <Specimen label="isFullWidth" isStretched>
          <div className={styles.narrow}>
            <SegmentedControl
              label={t('samples.viewLabel')}
              options={options}
              isFullWidth
            />
          </div>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
