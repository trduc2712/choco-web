import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Image } from '@/components/image/image'
import styles from '@/components/image/image.module.scss'
import { expectNoStyle, expectStyle } from '@/test/styles'

test('loads lazily and shows a placeholder until loaded', () => {
  const { container } = render(
    <Image src="https://example.com/image.png" alt="Alt Text" ratio={1} />,
  )
  const image = screen.getByRole('img', { name: 'Alt Text' })

  expect(image).toHaveAttribute('loading', 'lazy')
  expectStyle(container.firstElementChild, styles, 'loading')

  fireEvent.load(image)

  expectNoStyle(container.firstElementChild, styles, 'loading')
})

test('keeps its name when the image fails', () => {
  render(<Image src="https://example.com/missing.png" alt="Alt Text" />)

  fireEvent.error(screen.getByRole('img', { name: 'Alt Text' }))

  expect(screen.getByRole('img', { name: 'Alt Text' }).tagName).toBe('SPAN')
})
