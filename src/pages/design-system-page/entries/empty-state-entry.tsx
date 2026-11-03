import { useTranslation } from 'react-i18next'

import type { EmptyStateSize } from '@/components'
import { Button, EmptyState } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const SIZES: EmptyStateSize[] = ['sm', 'md', 'lg']

export function EmptyStateEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        {SIZES.map((size) => (
          <Specimen key={size} label={size} isStretched>
            <EmptyState
              icon="inbox"
              size={size}
              headingLevel={3}
              title={t('samples.emptyTitle')}
              description={t('samples.emptyDescription')}
              action={
                <Button size={size === 'sm' ? 'sm' : 'md'}>
                  {t('samples.emptyAction')}
                </Button>
              }
            />
          </Specimen>
        ))}
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.minimal')}>
        <EmptyState headingLevel={3} title={t('samples.emptyTitle')} />
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.alert')}>
        <EmptyState
          icon="alert-circle"
          role="alert"
          headingLevel={3}
          title={t('samples.errorTitle')}
          description={t('samples.errorDescription')}
        />
      </ShowcaseSection>
    </>
  )
}
