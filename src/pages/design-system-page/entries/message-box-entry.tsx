import { useTranslation } from 'react-i18next'

import { MessageBox } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

export function MessageBoxEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <SpecimenRow>
          <Specimen label="default">
            <MessageBox>{t('samples.body')}</MessageBox>
          </Specimen>
          <Specimen label="meta">
            <MessageBox meta={t('samples.muted')}>
              {t('samples.body')}
            </MessageBox>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.lines')}>
        <SpecimenRow>
          <Specimen label="lines={2}">
            <MessageBox lines={2}>{t('samples.longBody')}</MessageBox>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.interactive')}>
        <SpecimenRow>
          <Specimen label="onClick">
            <MessageBox meta={t('samples.muted')} onClick={() => {}}>
              {t('samples.body')}
            </MessageBox>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
    </>
  )
}
