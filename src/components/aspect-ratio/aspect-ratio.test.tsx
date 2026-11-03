import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { AspectRatio } from '@/components/aspect-ratio/aspect-ratio'

test('an aspect ratio box keeps its proportions', () => {
  render(
    <AspectRatio ratio={4 / 3} data-testid="frame">
      <img src="https://example.com/image.png" alt="Alt Text" />
    </AspectRatio>,
  )

  expect(screen.getByTestId('frame').style.aspectRatio).toMatch(/^1.333/)
})
