import { useTranslation } from 'react-i18next'

import type { InputSize } from '@/components'
import { Input, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const SIZES: InputSize[] = ['sm', 'md', 'lg']

export function InputEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <Stack gap={5} className={styles.narrow}>
          {SIZES.map((size) => (
            <Specimen key={size} label={size} isStretched>
              <Input
                label={t('samples.fieldLabel')}
                placeholder={t('samples.fieldPlaceholder')}
                size={size}
              />
            </Specimen>
          ))}
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.validation')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="hint" isStretched>
            <Input
              label={t('samples.fieldLabel')}
              hint={t('samples.fieldHint')}
            />
          </Specimen>
          <Specimen label="error" isStretched>
            <Input
              label={t('samples.fieldLabel')}
              hint={t('samples.fieldHint')}
              error={t('samples.fieldError')}
            />
          </Specimen>
          <Specimen label="required" isStretched>
            <Input label={t('samples.fieldLabel')} required />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withIcons')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="icon" isStretched>
            <Input
              label={t('samples.searchLabel')}
              icon="search"
              type="search"
            />
          </Specimen>
          <Specimen label="icon + isLabelHidden" isStretched>
            <Input
              label={t('samples.searchLabel')}
              placeholder={t('search.placeholder')}
              icon="search"
              type="search"
              isLabelHidden
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.types')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="email" isStretched>
            <Input
              label={t('samples.emailLabel')}
              type="email"
              icon="mail"
              autoComplete="email"
            />
          </Specimen>
          <Specimen label="password" isStretched>
            <Input
              label={t('samples.passwordLabel')}
              type="password"
              icon="lock"
              autoComplete="new-password"
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="disabled" isStretched>
            <Input label={t('samples.fieldLabel')} disabled />
          </Specimen>
          <Specimen label="readOnly" isStretched>
            <Input
              label={t('samples.fieldLabel')}
              defaultValue={t('samples.personName')}
              readOnly
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
    </>
  )
}
