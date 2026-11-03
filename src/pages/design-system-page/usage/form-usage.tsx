import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { Form, FormField, FormSubmit, Input } from '@/components'

const schema = z.object({ email: z.email() })

type Values = z.infer<typeof schema>

export function FormUsage() {
  const { t } = useTranslation('designSystem')
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  return (
    <Form form={form} onSubmit={(values) => console.warn(values)}>
      <FormField<Values, 'email'>
        name="email"
        render={({ field, error }) => (
          <Input {...field} label={t('samples.emailLabel')} error={error} />
        )}
      />
      <FormSubmit>{t('samples.signUp')}</FormSubmit>
    </Form>
  )
}
