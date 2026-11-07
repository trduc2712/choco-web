import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test } from 'vitest'

import { PostComposerPage } from './post-composer-page'

test('previews a plain-text post with line breaks and clears the draft', async () => {
  const user = userEvent.setup()
  render(<PostComposerPage />)

  const input = screen.getByRole('textbox', { name: 'Post text' })
  const submit = screen.getByRole('button', { name: 'Post' })

  await user.type(input, '   ')
  expect(submit).toBeDisabled()

  await user.clear(input)
  await user.type(input, 'Hello{enter}1. First line{enter}2. Second line')
  await user.click(submit)

  expect(screen.getByRole('article').querySelector('p')?.textContent).toBe(
    'Hello\n1. First line\n2. Second line',
  )
  expect(input).toHaveValue('')
  expect(submit).toBeDisabled()
})

test('counts an emoji as one code point and blocks over-limit posts', async () => {
  render(<PostComposerPage />)

  const input = screen.getByRole('textbox', { name: 'Post text' })
  const submit = screen.getByRole('button', { name: 'Post' })
  const body = '🍫'.repeat(280)

  fireEvent.change(input, { target: { value: body } })
  expect(screen.getByText('280 / 280')).toBeInTheDocument()
  await waitFor(() => expect(submit).toBeEnabled())

  fireEvent.change(input, { target: { value: body + '!' } })
  expect(input).toHaveAccessibleDescription('Use 280 characters or fewer.')
  await waitFor(() => expect(submit).toBeDisabled())
})
