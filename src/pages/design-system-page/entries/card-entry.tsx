import { useTranslation } from 'react-i18next'

import type { CardPadding, CardVariant } from '@/components'
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Stack,
  Text,
} from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

const VARIANTS: CardVariant[] = ['outlined', 'elevated', 'filled']
const PADDINGS: CardPadding[] = ['sm', 'md', 'lg']

export function CardEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.variants')}>
        <div className={styles.grid}>
          {VARIANTS.map((variant) => (
            <Specimen key={variant} label={variant} isStretched>
              <Card variant={variant}>
                <CardBody>
                  <Text>{t('samples.body')}</Text>
                </CardBody>
              </Card>
            </Specimen>
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.padding')}>
        <div className={styles.grid}>
          {PADDINGS.map((padding) => (
            <Specimen key={padding} label={padding} isStretched>
              <Card padding={padding}>
                <CardBody>
                  <Text>{t('samples.body')}</Text>
                </CardBody>
              </Card>
            </Specimen>
          ))}
        </div>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.parts')}>
        <Specimen label="article">
          <Card as="article" className={styles.narrow}>
            <CardHeader>
              <Avatar name={t('samples.personName')} />
              <Stack gap={1}>
                <Text weight="semibold">{t('samples.personName')}</Text>
                <Text size="sm" tone="muted">
                  {t('samples.muted')}
                </Text>
              </Stack>
            </CardHeader>
            <CardBody>
              <Text>{t('samples.longBody')}</Text>
            </CardBody>
            <CardFooter>
              <Button size="sm">{t('samples.action')}</Button>
              <Button variant="ghost" size="sm">
                {t('samples.cancel')}
              </Button>
            </CardFooter>
          </Card>
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
