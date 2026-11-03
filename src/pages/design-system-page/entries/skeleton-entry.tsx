import { useTranslation } from 'react-i18next'

import { Card, CardBody, CardHeader, Skeleton, Stack } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function SkeletonEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.shapes')}>
        <Specimen label="text">
          <Skeleton width="12rem" />
        </Specimen>
        <Specimen label="rect">
          <Skeleton shape="rect" width="12rem" height="6rem" />
        </Specimen>
        <Specimen label="circle">
          <Skeleton shape="circle" width="3rem" height="3rem" />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.lines')}>
        <Specimen label="lines={3}">
          <Skeleton lines={3} width="16rem" />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.animation')}>
        <Specimen label="isAnimated={false}">
          <Skeleton width="12rem" isAnimated={false} />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.loading')}>
        <Card className={styles.narrow}>
          <CardHeader>
            <Skeleton shape="circle" width="2.5rem" height="2.5rem" />
            <Skeleton width="8rem" />
          </CardHeader>
          <CardBody>
            <Stack gap={3}>
              <Skeleton lines={2} width="100%" />
              <Skeleton shape="rect" width="100%" height="6rem" />
            </Stack>
          </CardBody>
        </Card>
      </ShowcaseSection>
    </>
  )
}
