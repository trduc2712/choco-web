import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { Textarea } from '@/components/textarea/textarea'
import { expectNoA11yViolations } from '@/test/a11y'

test('is labelled, typeable and described by its error', async () => {
  const { container } = render(<Textarea label="Notes" error="Too short" />)
  const textarea = screen.getByRole('textbox', { name: 'Notes' })

  await userEvent.type(textarea, 'Hello')

  expect(textarea).toHaveValue('Hello')
  expect(textarea).toBeInvalid()
  expect(textarea).toHaveAccessibleDescription('Too short')
  await expectNoA11yViolations(container)
})
