import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { CopyButton } from '@/components/copy-button/copy-button'
import { cx } from '@/lib/cx'

import styles from './code-block.module.scss'
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
    <div className={cx(styles.root, className)}>
      <div className={styles.bar}>
        <span className={styles.title}>{title ?? language}</span>
        <CopyButton value={code} label={t('codeBlock.copy')} />
      </div>
      <div className={cx(styles.viewport, isCollapsed && styles.collapsed)}>
        <pre
          id={codeId}
          className={styles.code}
          tabIndex={0}
          role="group"
          aria-label={t('codeBlock.label')}
        >
          <code>
            {lines.map((tokens, lineIndex) => (
              <span key={lineIndex} className={styles.line}>
                {tokens.map((token, tokenIndex) => (
                  <span key={tokenIndex} className={styles[token.kind]}>
                    {token.text}
                  </span>
                ))}
                {'\n'}
              </span>
            ))}
          </code>
        </pre>
        {canCollapse && (
          <div className={styles.toggle}>
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
    <span key={index} className={styles[token.kind]}>
      {token.text}
    </span>
  ))
}
