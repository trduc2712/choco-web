import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { CodeBlock, CodeTokens, CopyButton, Heading, Icon } from '@/components'
import { highlight } from '@/components/code-block/highlight'
import { DESIGN_SYSTEM_PATH } from '@/constants/routes'

import { AccessibilityNotes } from './accessibility-notes'
import { DocSection } from './doc-section'
import styles from './entry-article.module.scss'
import { useEntryDocs } from './entry-docs'
import { EntryPager } from './entry-pager'
import { Guidelines } from './guidelines'
import { PropsTable } from './props-table'
import type { ShowcaseEntry } from './showcase-entries'
import { getImportSnippet } from './showcase-entries'

type EntryArticleProps = {
  entry: ShowcaseEntry
  titleRef: Ref<HTMLHeadingElement>
}

export function EntryArticle({ entry, titleRef }: EntryArticleProps) {
  const { t } = useTranslation('designSystem')
  const docs = useEntryDocs(entry.id)
  const importSnippet = getImportSnippet(entry)

  return (
    <article className={styles.root}>
      <header className={styles.header}>
        <RouterLink
          className={styles.group}
          to={`${DESIGN_SYSTEM_PATH}#${entry.group}`}
        >
          {t(`groups.${entry.group}`)}
        </RouterLink>
        <Heading
          ref={titleRef}
          className={styles.title}
          level={1}
          size="3xl"
          tabIndex={-1}
        >
          {entry.name}
        </Heading>
        <p className={styles.lead}>{docs.description}</p>
        {importSnippet && <ImportLine code={importSnippet} />}
      </header>

      <section className={styles.preview} aria-label={t('docs.preview')}>
        <div className={styles.stage}>
          <div className={styles.stageContent}>
            <entry.usage.Component />
          </div>
        </div>
        <CodeBlock
          className={styles.previewCode}
          code={entry.usage.code.trim()}
          language={entry.usage.language}
        />
      </section>

      <DocSection id="examples" title={t('docs.examples')}>
        <div className={styles.examples}>
          <entry.Component />
        </div>
      </DocSection>

      <DocSection id="guidelines" title={t('docs.guidelines')}>
        <Guidelines
          whenToUse={docs.whenToUse}
          whenNotToUse={docs.whenNotToUse}
        />
      </DocSection>

      <DocSection id="accessibility" title={t('docs.accessibility')}>
        <AccessibilityNotes
          notes={docs.accessibility}
          keyboard={docs.keyboard}
        />
      </DocSection>

      {docs.props && (
        <DocSection id="api-reference" title={t('docs.api')}>
          <PropsTable props={docs.props} />
        </DocSection>
      )}

      <EntryPager entry={entry} />
    </article>
  )
}

type ImportLineProps = {
  code: string
}

function ImportLine({ code }: ImportLineProps) {
  const { t } = useTranslation()
  const [tokens = []] = highlight(code, 'tsx')

  return (
    <div className={styles.import}>
      <Icon className={styles.importIcon} name="download" size="sm" />
      <code className={styles.importCode}>
        <CodeTokens tokens={tokens} />
      </code>
      <CopyButton value={code} label={t('codeBlock.copy')} />
    </div>
  )
}
