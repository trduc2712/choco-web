import { useTranslation } from 'react-i18next'

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Heading,
  Text,
} from '@/components'

export function CardUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Card as="section" aria-label={t('samples.heading')}>
      <CardHeader>
        <Heading level={3} size="md">
          {t('samples.heading')}
        </Heading>
      </CardHeader>
      <CardBody>
        <Text>{t('samples.body')}</Text>
      </CardBody>
      <CardFooter>
        <Button size="sm">{t('samples.action')}</Button>
        <Button variant="ghost" size="sm">
          {t('samples.cancel')}
        </Button>
      </CardFooter>
    </Card>
  )
}
