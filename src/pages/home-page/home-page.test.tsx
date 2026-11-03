import { render } from '@testing-library/react'
import { expect, test } from 'vitest'

import { HomePage } from '@/pages/home-page/home-page'

test('renders nothing', () => {
  const { container } = render(<HomePage />)

  expect(container).toBeEmptyDOMElement()
})
