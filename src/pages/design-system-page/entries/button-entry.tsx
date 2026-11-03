import { useTranslation } from 'react-i18next'

import type { ButtonShape, ButtonSize, ButtonVariant } from '@/components'
import { Button } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'
import styles from './entries.module.scss'

const VARIANTS: ButtonVariant[] = [
  'primary',
  'secondary',
  'subtle',
  'ghost',
  'danger',
  'link',
]
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']
const SHAPES: ButtonShape[] = ['default', 'pill']
const PRESSABLE_VARIANTS: ButtonVariant[] = ['secondary', 'subtle', 'ghost']

export function ButtonEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.variants')}>
        <SpecimenRow>
          {VARIANTS.map((variant) => (
            <Specimen key={variant} label={variant}>
              <Button variant={variant}>{t('samples.action')}</Button>
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.sizes')}>
        {VARIANTS.map((variant) => (
          <SpecimenRow key={variant}>
            {SIZES.map((size) => (
              <Specimen key={size} label={`${variant} / ${size}`}>
                <Button variant={variant} size={size}>
                  {t('samples.action')}
                </Button>
              </Specimen>
            ))}
          </SpecimenRow>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.shapes')}>
        <SpecimenRow>
          {SHAPES.map((shape) => (
            <Specimen key={shape} label={shape}>
              <Button shape={shape}>{t('samples.action')}</Button>
            </Specimen>
          ))}
          <Specimen label="pill / icon">
            <Button icon="plus" shape="pill" aria-label={t('samples.add')} />
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withIcons')}>
        <SpecimenRow>
          <Specimen label="iconStart">
            <Button iconStart="plus">{t('samples.add')}</Button>
          </Specimen>
          <Specimen label="iconEnd">
            <Button variant="secondary" iconEnd="chevron-down">
              {t('samples.options')}
            </Button>
          </Specimen>
          <Specimen label="iconStart + iconEnd">
            <Button variant="subtle" iconStart="edit" iconEnd="arrow-right">
              {t('samples.edit')}
            </Button>
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.iconOnly')}>
        {VARIANTS.map((variant) => (
          <SpecimenRow key={variant}>
            {SIZES.map((size) => (
              <Specimen key={size} label={`${variant} / ${size}`}>
                <Button
                  icon="star"
                  variant={variant}
                  size={size}
                  aria-label={t('samples.favorite')}
                />
              </Specimen>
            ))}
          </SpecimenRow>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.states')}>
        {VARIANTS.map((variant) => (
          <SpecimenRow key={variant}>
            <Specimen label={variant}>
              <Button variant={variant}>{t('samples.action')}</Button>
            </Specimen>
            <Specimen label="isLoading">
              <Button variant={variant} isLoading>
                {t('samples.loading')}
              </Button>
            </Specimen>
            <Specimen label="disabled">
              <Button variant={variant} disabled>
                {t('samples.action')}
              </Button>
            </Specimen>
            {PRESSABLE_VARIANTS.includes(variant) && (
              <Specimen label="aria-pressed">
                <Button variant={variant} aria-pressed>
                  {t('samples.action')}
                </Button>
              </Specimen>
            )}
          </SpecimenRow>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.fullWidth')}>
        <Specimen label="isFullWidth" isStretched>
          <div className={styles.narrow}>
            <Button isFullWidth>{t('samples.action')}</Button>
          </div>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
