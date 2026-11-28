import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PostComposer } from '@/features/post-composer'

export function PostComposerPage() {
  const { t } = useTranslation()
  const [preview, setPreview] = useState('')

  return (
    <main>
      <div>
        <div>
          <h1>{t('postComposer.title')}</h1>
          <p>{t('postComposer.reviewHint')}</p>
        </div>
        <PostComposer
          authorName={t('postComposer.author')}
          onPost={setPreview}
        />
        <div aria-live="polite">
          {preview ? (
            <article>
              <div>
                <h2>{t('postComposer.preview')}</h2>
                <p>{preview}</p>
              </div>
            </article>
          ) : null}
        </div>
      </div>
    </main>
  )
}
