import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

const COPIED_DURATION_MS = 2000

export type CopyButtonProps = {
  value: string
  label?: string
  copiedLabel?: string
  isLabelShown?: boolean
  onCopy?: () => void
  className?: string
}

export function CopyButton({
  value,
  label,
  copiedLabel,
  isLabelShown = false,
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

  return (
    <>
      {isLabelShown ? (
        <button type="button" className={className} onClick={() => void copy()}>
          {isCopied ? copiedText : name}
        </button>
      ) : (
        <button
          type="button"
          className={className}
          aria-label={name}
          onClick={() => void copy()}
        >
          {name}
        </button>
      )}
      <span className="visually-hidden" role="status">
        {isCopied ? copiedText : null}
      </span>
    </>
  )
}
