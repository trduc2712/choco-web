import { useTranslation } from 'react-i18next'

import { Text } from '@/components'
import layout from '@/styles/tokens/_layout.scss?raw'
import semantic from '@/styles/tokens/_semantic.scss?raw'
import typography from '@/styles/tokens/_typography.scss?raw'
import { parseTokens } from '@/styles/tokens/parse-tokens'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const tokenNames = [...parseTokens(semantic, typography, layout).keys()]

function tokensWithPrefix(prefix: string) {
  return tokenNames.filter((name) => name.startsWith(prefix))
}

const colors = tokensWithPrefix('--color-')
const fontSizes = tokensWithPrefix('--font-size-')
const fontWeights = tokensWithPrefix('--font-weight-')
const spaces = tokensWithPrefix('--space-')
const radii = tokensWithPrefix('--radius-')
const shadows = tokensWithPrefix('--shadow-')

export function ColorsEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.tokens')}>
      <div className={styles.grid}>
        {colors.map((name) => (
          <Specimen key={name} label={name}>
            <div
              className={styles.swatch}
              style={{ background: `var(${name})` }}
            />
          </Specimen>
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function TypographyEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        {fontSizes.map((name) => (
          <Specimen key={name} label={name}>
            <Text style={{ fontSize: `var(${name})` }}>{t('typeSample')}</Text>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.weights')}>
        {fontWeights.map((name) => (
          <Specimen key={name} label={name}>
            <Text style={{ fontWeight: `var(${name})` }}>
              {t('typeSample')}
            </Text>
          </Specimen>
        ))}
      </ShowcaseSection>
    </>
  )
}

export function SpacingEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.tokens')}>
      {spaces.map((name) => (
        <Specimen key={name} label={name}>
          <div className={styles.bar} style={{ width: `var(${name})` }} />
        </Specimen>
      ))}
    </ShowcaseSection>
  )
}

export function RadiusEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.tokens')}>
      <div className={styles.grid}>
        {radii.map((name) => (
          <Specimen key={name} label={name}>
            <div
              className={styles.box}
              style={{ borderRadius: `var(${name})` }}
            />
          </Specimen>
        ))}
      </div>
    </ShowcaseSection>
  )
}

export function ShadowsEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <ShowcaseSection title={t('sections.tokens')}>
      <div className={styles.grid}>
        {shadows.map((name) => (
          <Specimen key={name} label={name}>
            <div className={styles.box} style={{ boxShadow: `var(${name})` }} />
          </Specimen>
        ))}
      </div>
    </ShowcaseSection>
  )
}
