import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert, Button, Card, CardBody, Portal } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function PortalEntry() {
  const { t } = useTranslation('designSystem')
  const [isShown, setIsShown] = useState(false)

  return (
    <ShowcaseSection title={t('sections.default')}>
      <Specimen label="document.body">
        <Card className={styles.clipped}>
          <CardBody>
            <Button
              variant="secondary"
              onClick={() => setIsShown((current) => !current)}
            >
              {isShown ? t('samples.portalHide') : t('samples.portalShow')}
            </Button>
            {isShown && (
              <Portal>
                <div className={styles.portalBox}>
                  <Alert tone="info" onDismiss={() => setIsShown(false)}>
                    {t('samples.portalNote')}
                  </Alert>
                </div>
              </Portal>
            )}
          </CardBody>
        </Card>
      </Specimen>
    </ShowcaseSection>
  )
}
