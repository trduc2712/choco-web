import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { CopyButton } from '@/components/copy-button/copy-button'
import { cx } from '@/lib/cx'

import type { CodeLanguage, CodeToken } from './highlight'
import { highlight } from './highlight'

export type { CodeLanguage, CodeToken } from './highlight'

const COLLAPSE_AFTER_LINES = 14

export type CodeBlockProps = {
  code: string
  language: CodeLanguage
  title?: string
  isCollapsible?: boolean
  className?: string
}

export function CodeBlock({
  code,
  language,
  title,
  isCollapsible = true,
  className,
}: CodeBlockProps) {
  const { t } = useTranslation()
  const codeId = useId()
  const [isExpanded, setIsExpanded] = useState(false)
  const lines = useMemo(() => highlight(code, language), [code, language])
  const canCollapse = isCollapsible && lines.length > COLLAPSE_AFTER_LINES
  const isCollapsed = canCollapse && !isExpanded

  return (
    <div className={cx('code-block-root', className)}>
      <div className="code-block-bar">
        <span className="code-block-title">{title ?? language}</span>
        <CopyButton value={code} label={t('codeBlock.copy')} />
      </div>
      <div
        className={cx(
          'code-block-viewport',
          isCollapsed && 'code-block-collapsed',
        )}
      >
        <pre
          id={codeId}
          className="code-block-code"
          tabIndex={0}
          role="group"
          aria-label={t('codeBlock.label')}
        >
          <code>
            {lines.map((tokens, lineIndex) => (
              <span key={lineIndex} className="code-block-line">
                {tokens.map((token, tokenIndex) => (
                  <span key={tokenIndex} className={`code-block-${token.kind}`}>
                    {token.text}
                  </span>
                ))}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
        {canCollapse && (
          <div className="code-block-toggle">
            <Button
              variant="secondary"
              size="sm"
              iconEnd={isExpanded ? 'chevron-up' : 'chevron-down'}
              aria-expanded={isExpanded}
              aria-controls={codeId}
              onClick={() => setIsExpanded((current) => !current)}
            >
              {isExpanded ? t('codeBlock.collapse') : t('codeBlock.expand')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export type CodeTokensProps = {
  tokens: CodeToken[]
}

export function CodeTokens({ tokens }: CodeTokensProps) {
  return tokens.map((token, index) => (
    <span key={index} className={`code-block-${token.kind}`}>
      {token.text}
    </span>
  ))
}
