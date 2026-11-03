import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ButtonSize, ButtonVariant } from '@/components/button/button'
import { Button } from '@/components/button/button'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'

const COPIED_DURATION_MS = 2000

export type CopyButtonProps = {
  value: string
  label?: string
  copiedLabel?: string
  isLabelShown?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
  onCopy?: () => void
  className?: string
}

export function CopyButton({
  value,
  label,
  copiedLabel,
  isLabelShown = false,
  variant = 'ghost',
  size = 'sm',
  onCopy,
  className,
}: CopyButtonProps) {
  const { t } = useTranslation()
  const [isCopied, setIsCopied] = useState(false)
  const name = label ?? t('copyButton.copy')
  const copiedText = copiedLabel ?? t('copyButton.copied')

  useEffect(() => {
    if (!isCopied) {
      return
    }

    const timeout = setTimeout(() => setIsCopied(false), COPIED_DURATION_MS)

    return () => clearTimeout(timeout)
  }, [isCopied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setIsCopied(true)
      onCopy?.()
    } catch {
      setIsCopied(false)
    }
  }

  const icon = isCopied ? 'check' : 'copy'

  return (
    <>
      {isLabelShown ? (
        <Button
          className={className}
          iconStart={icon}
          variant={variant}
          size={size}
          onClick={() => void copy()}
        >
          {isCopied ? copiedText : name}
        </Button>
      ) : (
        <Button
          className={className}
          icon={icon}
          variant={variant}
          size={size}
          aria-label={name}
          onClick={() => void copy()}
        />
      )}
      <VisuallyHidden role="status">
        {isCopied ? copiedText : null}
      </VisuallyHidden>
    </>
  )
}
