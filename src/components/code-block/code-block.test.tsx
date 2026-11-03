import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { CodeBlock } from '@/components/code-block/code-block'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const LONG_CODE = Array.from(
  { length: 20 },
  (_, index) => `const value${index} = ${index}`,
).join('\n')

test('highlights code in a labelled, focusable block', async () => {
  const { container } = render(
    <CodeBlock code="const answer = 42" language="tsx" title="answer.ts" />,
  )
  const code = screen.getByRole('group', { name: i18n.t('codeBlock.label') })

  expect(code).toHaveTextContent('const answer = 42')
  expect(code).toHaveAttribute('tabindex', '0')
  expect(screen.getByText('answer.ts')).toBeInTheDocument()
  expect(
    screen.getByRole('button', { name: i18n.t('codeBlock.copy') }),
  ).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('collapses long code until expanded', async () => {
  render(<CodeBlock code={LONG_CODE} language="tsx" />)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('codeBlock.expand') }),
  )

  expect(
    screen.getByRole('button', { name: i18n.t('codeBlock.collapse') }),
  ).toHaveAttribute('aria-expanded', 'true')
})
