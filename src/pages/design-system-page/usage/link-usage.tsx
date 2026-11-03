import { useTranslation } from 'react-i18next'

import { Link, Stack } from '@/components'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'

const GUIDELINES_URL = 'https://www.w3.org/TR/WCAG21/'

export function LinkUsage() {
  const { t } = useTranslation('designSystem')

  return (
    <Stack direction="row" gap={4} isWrapping>
      <Link to={DESIGN_SYSTEM_PATH}>{t('samples.internalLink')}</Link>
      <Link href={GUIDELINES_URL} variant="standalone">
        {t('samples.externalLink')}
      </Link>
    </Stack>
  )
}
