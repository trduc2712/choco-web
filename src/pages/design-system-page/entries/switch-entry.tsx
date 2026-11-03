import { useTranslation } from 'react-i18next'

import type { SwitchLabelPosition } from '@/components'
import { Switch } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const POSITIONS: SwitchLabelPosition[] = ['end', 'start']

export function SwitchEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.states')}>
        <Specimen label="off">
          <Switch label={t('samples.switchLabel')} />
        </Specimen>
        <Specimen label="defaultChecked">
          <Switch label={t('samples.switchLabel')} defaultChecked />
        </Specimen>
        <Specimen label="disabled">
          <Switch label={t('samples.switchLabel')} disabled />
        </Specimen>
        <Specimen label="disabled + defaultChecked">
          <Switch label={t('samples.switchLabel')} disabled defaultChecked />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.labelPosition')}>
        <div className={styles.narrow}>
          {POSITIONS.map((position) => (
            <Specimen key={position} label={position} isStretched>
              <Switch
                label={t('samples.switchLabel')}
                labelPosition={position}
              />
            </Specimen>
          ))}
        </div>
      </ShowcaseSection>
    </>
  )
}
