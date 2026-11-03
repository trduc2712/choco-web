import { useTranslation } from 'react-i18next'

import { Fieldset, Input } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function FieldsetEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Specimen label="legend + hint" isStretched>
          <div className={styles.narrow}>
            <Fieldset
              legend={t('samples.fieldsetLegend')}
              hint={t('samples.fieldsetHint')}
            >
              <Input
                label={t('samples.streetLabel')}
                autoComplete="street-address"
              />
              <Input
                label={t('samples.cityLabel')}
                autoComplete="address-level2"
              />
            </Fieldset>
          </div>
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Specimen label="isDisabled" isStretched>
          <div className={styles.narrow}>
            <Fieldset legend={t('samples.fieldsetLegend')} isDisabled>
              <Input label={t('samples.streetLabel')} />
            </Fieldset>
          </div>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
