import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { FileUpload } from '@/components/file-upload/file-upload'
import { formatFileSize } from '@/components/file-upload/format-file-size'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const PHOTO = new File(['x'.repeat(2048)], 'photo.png', { type: 'image/png' })
const NOTES = new File(['notes'], 'notes.txt', { type: 'text/plain' })

test('formats file sizes', () => {
  expect(formatFileSize(512, 'en')).toBe('512 byte')
  expect(formatFileSize(2048, 'en')).toBe('2 kB')
  expect(formatFileSize(5 * 1024 ** 2, 'en')).toBe('5 MB')
})

test('picks files and lists them with a way to remove each', async () => {
  const onChange = vi.fn()
  const { container } = render(
    <FileUpload label="Attachments" isMultiple onChange={onChange} />,
  )

  await userEvent.upload(screen.getByLabelText('Attachments'), [PHOTO, NOTES])

  const list = screen.getByRole('list', { name: i18n.t('fileUpload.selected') })

  expect(list).toHaveTextContent('photo.png')
  expect(list).toHaveTextContent('2 kB')
  expect(onChange).toHaveBeenLastCalledWith([PHOTO, NOTES])
  await expectNoA11yViolations(container)

  await userEvent.click(
    screen.getByRole('button', {
      name: i18n.t('fileUpload.remove', { name: 'photo.png' }),
    }),
  )

  expect(onChange).toHaveBeenLastCalledWith([NOTES])
})

test('accepts dropped files that match the accepted types', () => {
  const onChange = vi.fn()
  const { container } = render(
    <FileUpload label="Photo" accept="image/*" onChange={onChange} />,
  )
  const dropzone = container.querySelector('input')?.parentElement

  fireEvent.drop(dropzone as Element, {
    dataTransfer: { files: [NOTES, PHOTO] },
  })

  expect(onChange).toHaveBeenLastCalledWith([PHOTO])
})

test('opens the file picker from the browse button', async () => {
  render(<FileUpload label="Photo" hint="PNG up to 5 MB" />)
  const input = screen.getByLabelText<HTMLInputElement>('Photo')
  const click = vi.spyOn(input, 'click')

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('fileUpload.browse') }),
  )

  expect(click).toHaveBeenCalled()
  expect(
    screen.getByRole('button', { name: i18n.t('fileUpload.browse') }),
  ).toHaveAccessibleDescription('PNG up to 5 MB')
})
