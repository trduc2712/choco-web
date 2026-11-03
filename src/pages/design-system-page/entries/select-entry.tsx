import { useTranslation } from 'react-i18next'

import type { SelectSize } from '@/components'
import { Select, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const SIZES: SelectSize[] = ['sm', 'md', 'lg']
const NUMBERS = [1, 2, 3, 4]

export function SelectEntry() {
  const { t } = useTranslation('designSystem')
  const label = t('samples.selectLabel')
  const placeholder = t('samples.selectPlaceholder')
  const options = NUMBERS.map((number) => ({
    value: String(number),
    label: t('samples.option', { number }),
    isDisabled: number === 3,
  }))

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <Stack gap={5} className={styles.narrow}>
          {SIZES.map((size) => (
            <Specimen key={size} label={size} isStretched>
              <Select
                label={label}
                placeholder={placeholder}
                options={options}
                size={size}
              />
            </Specimen>
          ))}
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.validation')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="hint" isStretched>
            <Select
              label={label}
              placeholder={placeholder}
              hint={t('samples.fieldHint')}
              options={options}
            />
          </Specimen>
          <Specimen label="error" isStretched>
            <Select
              label={label}
              placeholder={placeholder}
              error={t('samples.fieldError')}
              options={options}
            />
          </Specimen>
          <Specimen label="isRequired" isStretched>
            <Select
              label={label}
              placeholder={placeholder}
              options={options}
              isRequired
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="defaultValue" isStretched>
            <Select label={label} options={options} defaultValue="2" />
          </Specimen>
          <Specimen label="isLabelHidden" isStretched>
            <Select
              label={label}
              placeholder={placeholder}
              options={options}
              isLabelHidden
            />
          </Specimen>
          <Specimen label="isDisabled" isStretched>
            <Select
              label={label}
              placeholder={placeholder}
              options={options}
              isDisabled
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
    </>
  )
}
