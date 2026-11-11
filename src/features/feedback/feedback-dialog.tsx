import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'

import { Alert } from '@/components/alert/alert'
import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import type { IconName } from '@/components/icon/icon-paths'
import { SegmentedControl } from '@/components/segmented-control/segmented-control'
import { Text } from '@/components/text/text'
import { Textarea } from '@/components/textarea/textarea'
import { useToast } from '@/components/toast/use-toast'
import { useTheme } from '@/features/theme'
import { ApiError } from '@/lib/api-client'

import {
  feedbackFieldErrors,
  formatWait,
  retryAfterSeconds,
  useSendFeedback,
} from './feedback-api'
import { buildFeedbackContext } from './feedback-context'
import styles from './feedback-dialog.module.scss'
import type { FeedbackCategory, FeedbackMessageIssue } from './feedback-schema'
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_MESSAGE_MAX_LENGTH,
  FEEDBACK_MESSAGE_MIN_LENGTH,
  feedbackLength,
  validateFeedbackMessage,
} from './feedback-schema'

const CATEGORY_ICONS: Record<FeedbackCategory, IconName> = {
  bug: 'bug',
  suggestion: 'lightbulb',
  other: 'more-horizontal',
}

export function FeedbackDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const { showToast } = useToast()
  const { pathname } = useLocation()
  const { theme } = useTheme()
  const formId = useId()
  // The dialog stays mounted, so the draft lives as long as the tab does.
  const [category, setCategory] = useState<FeedbackCategory>('bug')
  const [message, setMessage] = useState('')
  const [clientIssue, setClientIssue] = useState<FeedbackMessageIssue>()
  const { mutate, isPending, error, reset } = useSendFeedback()

  const length = feedbackLength(message)
  const fieldErrors = feedbackFieldErrors(error)
  const serverMessageError = fieldErrors.message
  const seconds = retryAfterSeconds(error)
  let alert: string | undefined
  if (error instanceof ApiError && error.status === 429) {
    alert =
      seconds === undefined
        ? t('feedback.rateLimitedNoWait')
        : t('feedback.rateLimited', {
            wait: formatWait(seconds, i18n.language),
          })
  } else if (fieldErrors.category) {
    alert = fieldErrors.category
  } else if (error && serverMessageError === undefined) {
    alert = t('feedback.sendError')
  }

  const clientError = clientIssue
    ? t(`feedback.${clientIssue}`, {
        min: FEEDBACK_MESSAGE_MIN_LENGTH,
        max: FEEDBACK_MESSAGE_MAX_LENGTH,
      })
    : undefined

  const guardRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const guard = guardRef.current
    if (!guard || !isPending) return
    // `cancel` does not bubble, so listen while it travels down.
    const stop = (event: Event) => event.preventDefault()
    guard.addEventListener('cancel', stop, true)
    return () => guard.removeEventListener('cancel', stop, true)
  }, [isPending])

  function close() {
    if (!isPending) onClose()
  }

  function submit() {
    const issue = validateFeedbackMessage(message)
    setClientIssue(issue)
    if (issue) return

    mutate(
      {
        category,
        message,
        context: buildFeedbackContext({
          pathname,
          language: i18n.resolvedLanguage ?? i18n.language,
          theme,
          userAgent: navigator.userAgent,
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          appVersion: __APP_VERSION__,
        }),
      },
      {
        onSuccess: () => {
          setMessage('')
          setCategory('bug')
          setClientIssue(undefined)
          onClose()
          showToast({ title: t('feedback.thanks'), tone: 'success' })
        },
      },
    )
  }

  return (
    // The native Esc key closes a <dialog> on its own; stop it while sending.
    <div ref={guardRef}>
      <Dialog
        isOpen={isOpen}
        onClose={close}
        title={t('feedback.title')}
        footer={
          <div className={styles.actions}>
            <Button variant="ghost" disabled={isPending} onClick={close}>
              {t('feedback.cancel')}
            </Button>
            <Button type="submit" form={formId} isLoading={isPending}>
              {t('feedback.submit')}
            </Button>
          </div>
        }
      >
        <form
          id={formId}
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (!isPending) submit()
          }}
        >
          {alert && (
            <Alert tone="danger" role="alert">
              {alert}
            </Alert>
          )}
          <SegmentedControl
            label={t('feedback.category')}
            value={category}
            onChange={(value) => setCategory(value as FeedbackCategory)}
            isFullWidth
            options={FEEDBACK_CATEGORIES.map((value) => ({
              value,
              icon: CATEGORY_ICONS[value],
              label: t(`feedback.categories.${value}`),
              isDisabled: isPending,
            }))}
          />
          <Textarea
            label={t('feedback.message')}
            placeholder={t(`feedback.placeholders.${category}`)}
            rows={6}
            value={message}
            readOnly={isPending}
            hint={t('feedback.counter', {
              length,
              max: FEEDBACK_MESSAGE_MAX_LENGTH,
            })}
            error={clientError ?? serverMessageError}
            onChange={(event) => {
              setMessage(event.target.value)
              setClientIssue(undefined)
              if (error) reset()
            }}
          />
          <Text size="sm" tone="muted" className={styles.note}>
            {t('feedback.contextNote')}
          </Text>
        </form>
      </Dialog>
    </div>
  )
}
