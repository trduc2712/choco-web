import { useTranslation } from 'react-i18next'

import type { ToggleGroupItem } from '@/components'
import { ToggleGroup } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

export function ToggleGroupEntry() {
  const { t } = useTranslation('designSystem')
  const formatting: ToggleGroupItem[] = [
    {
      value: 'bold',
      label: t('samples.bold'),
      icon: 'bold',
      isLabelHidden: true,
    },
    {
      value: 'italic',
      label: t('samples.italic'),
      icon: 'italic',
      isLabelHidden: true,
    },
    {
      value: 'underline',
      label: t('samples.underline'),
      icon: 'underline',
      isLabelHidden: true,
    },
  ]
  const alignment: ToggleGroupItem[] = [
    { value: 'left', label: t('samples.alignLeft'), icon: 'align-left' },
    { value: 'center', label: t('samples.alignCenter'), icon: 'align-center' },
    { value: 'right', label: t('samples.alignRight'), icon: 'align-right' },
  ]

  return (
    <>
      <ShowcaseSection title={t('sections.multiple')}>
        <Specimen label="isMultiple">
          <ToggleGroup
            label={t('samples.formattingLabel')}
            items={formatting}
            defaultValue={['bold']}
            isMultiple
          />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withIcons')}>
        <Specimen label="single">
          <ToggleGroup
            label={t('samples.alignmentLabel')}
            items={alignment}
            defaultValue={['left']}
            size="sm"
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
