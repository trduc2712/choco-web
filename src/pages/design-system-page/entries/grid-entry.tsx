import { useTranslation } from 'react-i18next'

import type { GridColumns } from '@/components'
import { Grid } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const COLUMNS: GridColumns[] = [2, 3, 4]
const ITEMS = [1, 2, 3, 4, 5, 6]

export function GridEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.columns')}>
        {COLUMNS.map((columns) => (
          <Specimen key={columns} label={`columns ${columns}`} isStretched>
            <Grid columns={columns} gap={2}>
              {ITEMS.map((number) => (
                <div key={number} className={styles.block}>
                  {t('samples.gridItem', { number })}
                </div>
              ))}
            </Grid>
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.autoFill')}>
        <Specimen label="minItemWidth 8rem" isStretched>
          <Grid as="ul" minItemWidth="8rem" gap={2}>
            {ITEMS.map((number) => (
              <li key={number} className={styles.block}>
                {t('samples.gridItem', { number })}
              </li>
            ))}
          </Grid>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
