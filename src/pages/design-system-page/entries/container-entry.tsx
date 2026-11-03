import { useTranslation } from 'react-i18next'

import type { ContainerSize } from '@/components'
import { Container, Text } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const SIZES: ContainerSize[] = ['sm', 'md', 'lg', 'full']

export function ContainerEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.sizes')}>
      {SIZES.map((size) => (
        <Specimen key={size} label={size} isStretched>
          <div className={styles.frame}>
            <Container size={size}>
              <Text className={styles.block}>{t('samples.body')}</Text>
            </Container>
          </div>
        </Specimen>
      ))}
    </ShowcaseSection>
  )
}
