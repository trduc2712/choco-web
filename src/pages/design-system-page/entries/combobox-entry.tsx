import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ComboboxSize } from '@/components'
import { Combobox, ICON_NAMES, Stack, Text } from '@/components'
import { cx } from '@/lib/cx'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const OPTIONS = ICON_NAMES.map((name) => ({ value: name, label: name }))
const SIZES: ComboboxSize[] = ['sm', 'md', 'lg']

export function ComboboxEntry() {
  const { t } = useTranslation('designSystem')
  const [selected, setSelected] = useState<string>()

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <div className={cx(styles.narrow, styles.popupRoom)}>
          <Combobox
            label={t('samples.comboboxLabel')}
            placeholder={t('search.placeholder')}
            options={OPTIONS}
            onSelect={setSelected}
          />
          {selected && (
            <Text tone="muted" role="status">
              {t('samples.selected', { value: selected })}
            </Text>
          )}
        </div>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.sizes')}>
        <Stack gap={5} className={cx(styles.narrow, styles.popupRoom)}>
          {SIZES.map((size) => (
            <Specimen key={size} label={size} isStretched>
              <Combobox
                label={t('samples.comboboxLabel')}
                placeholder={t('search.placeholder')}
                options={OPTIONS}
                size={size}
                onSelect={setSelected}
              />
            </Specimen>
          ))}
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="isLabelHidden" isStretched>
            <Combobox
              label={t('samples.comboboxLabel')}
              placeholder={t('search.placeholder')}
              options={OPTIONS}
              isLabelHidden
              onSelect={setSelected}
            />
          </Specimen>
          <Specimen label="isDisabled" isStretched>
            <Combobox
              label={t('samples.comboboxLabel')}
              placeholder={t('search.placeholder')}
              options={OPTIONS}
              isDisabled
              onSelect={setSelected}
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.noResults')}>
        <div className={styles.narrow}>
          <Combobox
            label={t('samples.emptyComboboxLabel')}
            placeholder={t('search.placeholder')}
            options={[]}
            onSelect={setSelected}
          />
        </div>
      </ShowcaseSection>
    </>
  )
}
