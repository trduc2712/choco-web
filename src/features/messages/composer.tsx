import type { FormEvent, KeyboardEvent } from 'react'
import { useId, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Icon } from '@/components/icon/icon'
import { Skeleton } from '@/components/skeleton/skeleton'
import { Text } from '@/components/text/text'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cx } from '@/lib/cx'

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
  return (
    <div aria-hidden="true">
      <div className={cx('composer-pill', 'composer-pillSkeleton')}>
        <Skeleton width="var(--space-9)" />
        <Skeleton
          shape="circle"
          width="var(--size-icon-md)"
          height="var(--size-icon-md)"
        />
      </div>
    </div>
  )
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
          <Icon name="ban" size="sm" />
        </span>
        <div>
          <Text size="sm" weight="semibold">
            {t('messages.closed.blockedByMe')}
          </Text>
          <Text size="sm" tone="muted">
            {t('messages.closed.blockedByMeHint')}
          </Text>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      {closed ? (
        <Text size="sm" tone="muted" role="status">
          <Icon
            name={closed.reason === 'rateLimited' ? 'timer' : 'lock'}
            size="sm"
          />
          <span>
            {closed.reason === 'rateLimited'
              ? t('messages.closed.rateLimited', { seconds: closed.seconds })
              : t(`messages.closed.${closed.reason}`, { name })}
          </span>
        </Text>
      ) : null}
      {/* A pill with the send button at its end, as on Messenger. The Ares
          Textarea's label and hint layout doesn't fit inside one, so this is
          a plain textarea styled with Ares tokens. */}
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
        <Button
          type="submit"
          variant="ghost"
          icon="send"
          aria-label={t('messages.composer.send')}
          disabled={!canSend}
        />
      </div>
      {counter ? (
        <Text
          id={counterId}
          size="xs"
          tone={isOver ? 'danger' : 'muted'}
          align="end"
        >
          {counter}
        </Text>
      ) : null}
    </form>
  )
}
