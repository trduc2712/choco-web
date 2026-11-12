import { useTranslation } from 'react-i18next'

import { Highlight } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

export function HighlightEntry() {
  const { t } = useTranslation('designSystem')
  const text = t('samples.body')
  const query = t('samples.highlightQuery')

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <SpecimenRow>
          <Specimen label="query">
            <p>
              <Highlight text={text} query={query} />
            </p>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.multipleWords')}>
        <SpecimenRow>
          <Specimen label="query: two words">
            <p>
              <Highlight
                text={text}
                query={`${query} ${t('samples.highlightSecondQuery')}`}
              />
            </p>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
    </>
  )
}
