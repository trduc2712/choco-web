import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import { Field } from '@/components/field/field'
import {
  getDescribedBy,
  getErrorId,
  getHintId,
} from '@/components/field/field-ids'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'

const ID = 'name'

test('labels its control and shows the hint and error with their ids', async () => {
  const { container } = render(
    <Field id={ID} label="Name" hint="Shown to others" error="Enter a name">
      <input id={ID} aria-describedby={getDescribedBy(ID, 'hint', 'error')} />
    </Field>,
  )
  const input = screen.getByRole('textbox', { name: 'Name' })

  expect(screen.getByText('Shown to others')).toHaveAttribute(
    'id',
    getHintId(ID),
  )
  expect(screen.getByText('Enter a name')).toHaveAttribute('id', getErrorId(ID))
  expect(input).toHaveAccessibleDescription('Shown to others Enter a name')
  await expectNoA11yViolations(container)
})

test('announces that the control is required', () => {
  render(
    <Field id={ID} label="Name" isRequired>
      <input id={ID} />
    </Field>,
  )

  expect(
    screen.getByRole('textbox', {
      name: new RegExp(`Name.*${i18n.t('field.required')}`),
    }),
  ).toBeInTheDocument()
})

test('keeps the label for assistive technology when it is visually hidden', async () => {
  const { container } = render(
    <Field id={ID} label="Name" isLabelHidden>
      <input id={ID} />
    </Field>,
  )

  expect(screen.getByRole('textbox', { name: 'Name' })).toBeInTheDocument()
  await expectNoA11yViolations(container)
})

test.each([
  [undefined, undefined, undefined],
  ['hint', undefined, getHintId(ID)],
  [undefined, 'error', getErrorId(ID)],
  ['hint', 'error', `${getHintId(ID)} ${getErrorId(ID)}`],
])('describes by hint %s and error %s', (hint, error, expected) => {
  expect(getDescribedBy(ID, hint, error)).toBe(expected)
})
