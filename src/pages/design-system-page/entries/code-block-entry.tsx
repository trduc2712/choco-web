import { useTranslation } from 'react-i18next'

import { CodeBlock } from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'

const SHORT_CODE = `const username = 'username'`
const LONG_CODE = Array.from(
  { length: 18 },
  (_, index) => `export const step${index + 1} = ${index + 1}`,
).join('\n')
const SCSS_CODE = `.card {
  padding: var(--space-4);
  border-radius: var(--radius-lg);
}`

export function CodeBlockEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.default')}>
        <Specimen label="tsx" isStretched>
          <CodeBlock code={SHORT_CODE} language="tsx" title="username.ts" />
        </Specimen>
        <Specimen label="scss" isStretched>
          <CodeBlock code={SCSS_CODE} language="scss" />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.lines')}>
        <Specimen label="isCollapsible" isStretched>
          <CodeBlock code={LONG_CODE} language="tsx" />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
