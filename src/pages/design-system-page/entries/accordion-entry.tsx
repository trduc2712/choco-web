import { useTranslation } from 'react-i18next'

import { Accordion, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const NUMBERS = [1, 2, 3]

export function AccordionEntry() {
  const { t } = useTranslation('designSystem')
  const items = NUMBERS.map((number) => ({
    id: String(number),
    title: t('samples.accordionTitle', { number }),
    content: <Text>{t('samples.panel', { number })}</Text>,
  }))

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Specimen label="items" isStretched>
          <Accordion items={items} />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        <Specimen label="isOpenByDefault" isStretched>
          <Accordion
            items={items.map((item, index) => ({
              ...item,
              isOpenByDefault: index === 0,
            }))}
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.exclusive')}>
        <Specimen label="isExclusive" isStretched>
          <Accordion items={items} isExclusive />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
