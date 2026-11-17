import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

import { Button } from '@/components/button/button'
import { Heading } from '@/components/heading/heading'
import { Text } from '@/components/text/text'
import { SIGN_IN_PATH, SIGN_UP_PATH } from '@/constants/routes'

import styles from './landing-page.module.scss'

// What a signed-out visitor sees at "/": the name, one line, and the two ways in.
export function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <section className={styles.root}>
      <Heading level={1} size="3xl" align="center">
        {t('landing.brand')}
      </Heading>
      <Text size="lg" tone="muted" align="center">
        {t('landing.tagline')}
      </Text>
      <div className={styles.actions}>
        <Button size="lg" onClick={() => void navigate(SIGN_UP_PATH)}>
          {t('landing.signUp')}
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={() => void navigate(SIGN_IN_PATH)}
        >
          {t('landing.signIn')}
        </Button>
      </div>
    </section>
  )
}
