import { useTranslation } from 'react-i18next'

import type { ContainerSize } from '@/components'
import { Container, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const SIZES: ContainerSize[] = ['sm', 'md', 'lg', 'full']

export function ContainerEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.sizes')}>
      {SIZES.map((size) => (
        <Specimen key={size} label={size} isStretched>
          <div>
            <Container size={size}>
              <Text>{t('samples.body')}</Text>
            </Container>
          </div>
        </Specimen>
      ))}
    </ShowcaseSection>
  )
}
