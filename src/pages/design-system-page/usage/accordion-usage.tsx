import { useTranslation } from 'react-i18next'

import type { AccordionItem } from '@/components'
import { Accordion, Text } from '@/components'

const NUMBERS = [1, 2, 3]

export function AccordionUsage() {
  const { t } = useTranslation('designSystem')
  const items: AccordionItem[] = NUMBERS.map((number) => ({
    id: String(number),
    title: t('samples.accordionTitle', { number }),
    content: <Text>{t('samples.panel', { number })}</Text>,
    isOpenByDefault: number === 1,
  }))

  return <Accordion items={items} isExclusive />
}
