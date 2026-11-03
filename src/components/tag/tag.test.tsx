import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { Tag } from '@/components/tag/tag'
import styles from '@/components/tag/tag.module.scss'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('shows its label without a remove button by default', async () => {
  const { container } = render(<Tag label="Design" />)

  expect(screen.getByText('Design')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test('names its remove button after the label', async () => {
  const onRemove = vi.fn()
  const { container } = render(<Tag label="Design" onRemove={onRemove} />)

  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('tag.remove', { label: 'Design' }),
    }),
  )

  expect(onRemove).toHaveBeenCalledTimes(1)
  await expectNoA11yViolations(container)
})

test('applies the primary tone', () => {
  render(
    <>
      <Tag label="Plain" />
      <Tag label="Design" tone="primary" />
    </>,
  )

  expectNoStyle(screen.getByText('Plain'), styles, 'primary')
  expectStyle(screen.getByText('Design'), styles, 'primary')
})

test('shows a decorative icon', () => {
  render(<Tag label="Design" icon="hash" />)

  expect(screen.getByText('Design').querySelector('svg')).toHaveAttribute(
    'aria-hidden',
    'true',
  )
})
