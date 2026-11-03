import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import {
  Form,
  FormField,
  FormSubmit,
  Input,
  PasswordInput,
  Text,
} from '@/components'

import { ShowcaseSection, Specimen } from '../showcase-section'
import styles from './entries.module.scss'

export function FormEntry() {
  const { t } = useTranslation('designSystem')
  const [submitted, setSubmitted] = useState<string>()
  const schema = z.object({
    email: z.email(t('samples.formEmailError')),
    password: z.string().min(12, t('samples.newPasswordHint')),
  })
  type Values = z.infer<typeof schema>
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <ShowcaseSection title={t('sections.validation')}>
      <Specimen label="zod + react-hook-form" isStretched>
        <div className={styles.narrow}>
          <Form form={form} onSubmit={(values) => setSubmitted(values.email)}>
            <FormField<Values, 'email'>
              name="email"
              render={({ field, error }) => (
                <Input
                  {...field}
                  label={t('samples.emailLabel')}
                  type="email"
                  error={error}
                />
              )}
            />
            <FormField<Values, 'password'>
              name="password"
              render={({ field, error }) => (
                <PasswordInput
                  {...field}
                  label={t('samples.passwordLabel')}
                  autoComplete="new-password"
                  hint={t('samples.newPasswordHint')}
                  error={error}
                />
              )}
            />
            <FormSubmit>{t('samples.signUp')}</FormSubmit>
            {submitted && (
              <Text role="status" tone="muted" size="sm">
                {t('samples.signedUp', { email: submitted })}
              </Text>
            )}
          </Form>
        </div>
      </Specimen>
    </ShowcaseSection>
  )
}
