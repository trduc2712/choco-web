import { useTranslation } from 'react-i18next'

import type {
  StackAlign,
  StackDirection,
  StackGap,
  StackJustify,
} from '@/components'
import { Stack } from '@/components'
import { cx } from '@/lib/cx'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const DIRECTIONS: StackDirection[] = ['column', 'row']
const GAPS: StackGap[] = [1, 2, 3, 4, 5, 6, 7, 8]
const ALIGNS: StackAlign[] = ['start', 'center', 'end', 'stretch', 'baseline']
const JUSTIFIES: StackJustify[] = ['start', 'center', 'end', 'between']
const ITEMS = [1, 2, 3]
const MANY_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

export function StackEntry() {
  const { t } = useTranslation('designSystem')

  function renderItems(numbers: number[]) {
    return numbers.map((number) => (
      <div
        key={number}
        className={cx(styles.block, number % 2 === 0 && styles.tall)}
      >
        {t('samples.item', { number })}
      </div>
    ))
  }

  return (
    <>
      <ShowcaseSection title={t('sections.direction')}>
        {DIRECTIONS.map((direction) => (
          <Specimen key={direction} label={direction}>
            <Stack direction={direction} gap={2} align="start">
              {renderItems(ITEMS)}
            </Stack>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.gap')}>
        {GAPS.map((gap) => (
          <Specimen key={gap} label={`gap={${gap}}`}>
            <Stack direction="row" gap={gap} align="start">
              {renderItems(ITEMS)}
            </Stack>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.alignment')}>
        {ALIGNS.map((align) => (
          <Specimen key={align} label={align} isStretched>
            <Stack
              direction="row"
              gap={2}
              align={align}
              className={styles.outlined}
            >
              {renderItems(ITEMS)}
            </Stack>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.justification')}>
        {JUSTIFIES.map((justify) => (
          <Specimen key={justify} label={justify} isStretched>
            <Stack
              direction="row"
              gap={2}
              align="start"
              justify={justify}
              className={styles.outlined}
            >
              {renderItems(ITEMS)}
            </Stack>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.wrapping')}>
        <Specimen label="isWrapping">
          <Stack direction="row" gap={2} align="start" isWrapping>
            {renderItems(MANY_ITEMS)}
          </Stack>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
