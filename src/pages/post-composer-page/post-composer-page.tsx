import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Card } from '@/components/card/card'
import { Container } from '@/components/container/container'
import { Heading } from '@/components/heading/heading'
import { Stack } from '@/components/stack/stack'
import { Text } from '@/components/text/text'
import { PostComposer } from '@/features/post-composer'

import styles from './post-composer-page.module.scss'

export function PostComposerPage() {
  const { t } = useTranslation()
  const [preview, setPreview] = useState('')

  return (
    <Container as="main" size="sm" className={styles.page}>
      <Stack gap={5}>
        <Stack gap={2}>
          <Heading level={1}>{t('postComposer.title')}</Heading>
          <Text tone="muted">{t('postComposer.reviewHint')}</Text>
        </Stack>
        <PostComposer
          authorName={t('postComposer.author')}
          onPost={setPreview}
        />
        <div aria-live="polite">
          {preview ? (
            <Card as="article">
              <Stack gap={2}>
                <Heading level={2} size="sm">
                  {t('postComposer.preview')}
                </Heading>
                <Text className={styles.postBody}>{preview}</Text>
              </Stack>
            </Card>
          ) : null}
        </div>
      </Stack>
    </Container>
  )
}
