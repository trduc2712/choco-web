import { useTranslation } from 'react-i18next'

import { Card, CardBody, Grid } from '@/components'

const ITEMS = [1, 2, 3]

export function GridUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Grid as="ul" columns={3} gap={4}>
      {ITEMS.map((number) => (
        <li key={number}>
          <Card>
            <CardBody>{t('samples.gridItem', { number })}</CardBody>
          </Card>
        </li>
      ))}
    </Grid>
  )
}
