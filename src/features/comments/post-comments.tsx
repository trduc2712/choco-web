import { useCallback, useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'

import { CommentSection } from './comment-section'
import styles from './comments.module.scss'

type PostCommentsProps = {
  postId: string
  // Called when the API says the post no longer exists.
  onPostGone?: () => void
}

// A toggle under a post that expands its comment list and composer.
export function PostComments({ postId, onPostGone }: PostCommentsProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [isGone, setIsGone] = useState(false)
  const sectionId = useId()

  const handleGone = useCallback(() => {
    setIsGone(true)
    onPostGone?.()
  }, [onPostGone])

  return (
    <div className={styles.wrapper}>
      <div>
        <Button
          variant="ghost"
          size="sm"
          iconStart="message-dots"
          aria-expanded={isOpen}
          aria-controls={sectionId}
          onClick={() => setIsOpen((open) => !open)}
        >
          {t('comments.title')}
        </Button>
      </div>
      <div id={sectionId}>
        {isGone ? (
          <Alert tone="warning" role="alert">
            {t('comments.postGone')}
          </Alert>
        ) : isOpen ? (
          <CommentSection postId={postId} onPostGone={handleGone} />
        ) : null}
      </div>
    </div>
  )
}
