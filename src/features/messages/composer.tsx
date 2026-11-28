import type { FormEvent, KeyboardEvent } from 'react'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useMediaQuery } from '@/hooks/use-media-query'
import { cx } from '@/lib/cx'
import { symbols } from '@/lib/symbols'

import { MESSAGE_MAX_LENGTH, normalizeContent } from './messaging-types'

// The counter shows from this many characters before the limit.
const COUNTER_FROM = MESSAGE_MAX_LENGTH - 200

// Unsent text per conversation, kept while the tab is open.
const drafts = new Map<string, string>()

export type ComposerClosed =
  | {
      reason: 'blockedByMe' | 'blocked' | 'forbidden' | 'suspended' | 'notFound'
    }
  | { reason: 'rateLimited'; seconds: number }

export function ComposerSkeleton() {
  const { t } = useTranslation()
  return <span role="status">{t('common.loading')}</span>
}

export function Composer({
  draftKey,
  name,
  closed,
  isDisabled = false,
  onSend,
}: {
  draftKey: string
  name: string
  closed?: ComposerClosed
  // Not ready yet (the conversation is still loading).
  isDisabled?: boolean
  onSend: (content: string) => void
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState(() => drafts.get(draftKey) ?? '')
  const ownRef = useRef<HTMLTextAreaElement | null>(null)
  const counterId = useId()
  // On touch keyboards Enter makes a new line; the button sends.
  const sendsOnEnter = useMediaQuery('(hover: hover) and (pointer: fine)')
  const length = normalizeContent(value).length
  const isOver = length > MESSAGE_MAX_LENGTH
  const isClosed = closed !== undefined
  const canSend = !isClosed && !isDisabled && length > 0 && !isOver

  // Grows with its text up to the CSS max height, then scrolls.
  useLayoutEffect(() => {
    const element = ownRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${element.scrollHeight}px`
  }, [value, closed?.reason])

  function update(next: string) {
    setValue(next)
    if (next) drafts.set(draftKey, next)
    else drafts.delete(draftKey)
  }

  function submit() {
    if (!canSend) return
    onSend(value)
    update('')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    submit()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing &&
      sendsOnEnter
    ) {
      event.preventDefault()
      submit()
    }
  }

  const counter =
    length >= COUNTER_FROM
      ? isOver
        ? t('messages.composer.over', { count: length - MESSAGE_MAX_LENGTH })
        : t('messages.composer.remaining', {
            count: MESSAGE_MAX_LENGTH - length,
          })
      : undefined

  if (closed?.reason === 'blockedByMe') {
    return (
      <div role="status">
        <span>
          <span aria-hidden="true">⊘</span>
        </span>
        <div>
          <p>{t('messages.closed.blockedByMe')}</p>
          <p>{t('messages.closed.blockedByMeHint')}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {closed ? (
        <p role="status">
          <span aria-hidden="true">
            {symbols[closed.reason === 'rateLimited' ? 'timer' : 'lock']}
          </span>
          <span>
            {closed.reason === 'rateLimited'
              ? t('messages.closed.rateLimited', { seconds: closed.seconds })
              : t(`messages.closed.${closed.reason}`, { name })}
          </span>
        </p>
      ) : null}
      <div className={cx('composer-pill', isClosed && 'composer-pillDisabled')}>
        <textarea
          ref={ownRef}
          aria-label={t('messages.composer.label', { name })}
          aria-describedby={counter ? counterId : undefined}
          aria-invalid={isOver || undefined}
          aria-keyshortcuts={sendsOnEnter ? 'Enter' : undefined}
          placeholder={t('messages.composer.placeholder')}
          rows={1}
          value={value}
          disabled={isClosed}
          onChange={(event) => update(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="submit"
          aria-label={t('messages.composer.send')}
          disabled={!canSend}
        >
          {t('messages.composer.send')}
        </button>
      </div>
      {counter ? <p id={counterId}>{counter}</p> : null}
    </form>
  )
}
