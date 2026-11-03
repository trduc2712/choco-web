import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { TagInput } from '@/components/tag-input/tag-input'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

test('adds tags with Enter or a comma and skips duplicates', async () => {
  const onChange = vi.fn()
  const { container } = render(<TagInput label="Tags" onChange={onChange} />)
  const input = screen.getByRole('textbox', { name: 'Tags' })

  expect(input).toHaveAccessibleDescription(i18n.t('tagInput.instructions'))

  await userEvent.type(input, 'tag-1{Enter}tag-2,TAG-1{Enter}')

  expect(onChange).toHaveBeenLastCalledWith(['tag-1', 'tag-2'])
  expect(screen.getByRole('list', { name: 'Tags' }).children).toHaveLength(2)
  await expectNoA11yViolations(container)
})

test('removes tags with their button or Backspace', async () => {
  const onChange = vi.fn()
  render(
    <TagInput
      label="Tags"
      defaultValue={['tag-1', 'tag-2', 'tag-3']}
      onChange={onChange}
    />,
  )

  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('tag.remove', { label: 'tag-2' }),
    }),
  )

  expect(onChange).toHaveBeenLastCalledWith(['tag-1', 'tag-3'])
  expect(screen.getByRole('textbox')).toHaveFocus()

  await userEvent.keyboard('{Backspace}')

  expect(onChange).toHaveBeenLastCalledWith(['tag-1'])
})

test('stops accepting tags at the limit', () => {
  render(<TagInput label="Tags" defaultValue={['tag-1']} maxTags={1} />)

  expect(screen.getByRole('textbox')).toBeDisabled()
})
