import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Pagination } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function PaginationEntry() {
  const { t } = useTranslation('designSystem')
  const [shortPage, setShortPage] = useState(1)
  const [longPage, setLongPage] = useState(10)
  const [widePage, setWidePage] = useState(10)

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Specimen label="pageCount={5}">
          <Pagination
            label={t('sections.default')}
            page={shortPage}
            pageCount={5}
            onPageChange={setShortPage}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.range')}>
        <Specimen label="pageCount={20}">
          <Pagination
            label={t('sections.range')}
            page={longPage}
            pageCount={20}
            onPageChange={setLongPage}
          />
        </Specimen>
        <Specimen label="siblingCount={2}">
          <Pagination
            label={t('sections.wrapping')}
            page={widePage}
            pageCount={20}
            siblingCount={2}
            onPageChange={setWidePage}
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
