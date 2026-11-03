import { zodResolver } from '@hookform/resolvers/zod'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { expect, test, vi } from 'vitest'
import { z } from 'zod'

import { Form, FormField, FormSubmit } from '@/components/form/form'
import { Input } from '@/components/input/input'
import { expectNoA11yViolations } from '@/test/a11y'

const schema = z.object({
  email: z.email('Enter a valid email'),
})

type Values = z.infer<typeof schema>

function SignUp({ onSubmit }: { onSubmit: (values: Values) => void }) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  return (
    <Form form={form} onSubmit={onSubmit}>
      <FormField<Values, 'email'>
        name="email"
        render={({ field, error }) => (
          <Input {...field} label="Email" type="email" error={error} />
        )}
      />
      <FormSubmit>Sign up</FormSubmit>
    </Form>
  )
}

test('shows validation errors on the field and blocks submit', async () => {
  const onSubmit = vi.fn()
  const { container } = render(<SignUp onSubmit={onSubmit} />)

  await userEvent.click(screen.getByRole('button', { name: 'Sign up' }))

  const input = screen.getByRole('textbox', { name: 'Email' })

  expect(input).toHaveAccessibleDescription('Enter a valid email')
  expect(input).toHaveAttribute('aria-invalid', 'true')
  expect(input).toHaveFocus()
  expect(onSubmit).not.toHaveBeenCalled()
  await expectNoA11yViolations(container)
})

test('submits valid values', async () => {
  const onSubmit = vi.fn()
  render(<SignUp onSubmit={onSubmit} />)

  await userEvent.type(
    screen.getByRole('textbox', { name: 'Email' }),
    'an@example.com',
  )
  await userEvent.click(screen.getByRole('button', { name: 'Sign up' }))

  expect(onSubmit).toHaveBeenCalledWith(
    { email: 'an@example.com' },
    expect.anything(),
  )
})
