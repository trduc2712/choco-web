import { useTranslation } from 'react-i18next'

import { Stack, TagInput } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function TagInputEntry() {
  const { t } = useTranslation('designSystem')
  const tags = [1, 2, 3, 4].map((number) => t('samples.tagValue', { number }))

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Specimen label="suggestions" isStretched>
          <div className={styles.narrow}>
            <TagInput
              label={t('samples.tagsLabel')}
              placeholder={t('samples.tagsPlaceholder')}
              defaultValue={tags.slice(0, 2)}
              suggestions={tags}
              hint={t('samples.fieldHint')}
            />
          </div>
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withLimit')}>
        <Stack gap={5} className={styles.narrow}>
          <Specimen label="maxTags 2" isStretched>
            <TagInput
              label={t('samples.tagsLabel')}
              defaultValue={tags.slice(0, 2)}
              maxTags={2}
            />
          </Specimen>
          <Specimen label="error" isStretched>
            <TagInput
              label={t('samples.tagsLabel')}
              error={t('samples.fieldError')}
            />
          </Specimen>
        </Stack>
      </ShowcaseSection>
    </>
  )
}
