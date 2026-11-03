import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import type { InputProps } from '@/components/input/input'
import { Input } from '@/components/input/input'

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>

export function PasswordInput({
  autoComplete = 'current-password',
  disabled,
  ...props
}: PasswordInputProps) {
  const { t } = useTranslation()
  const [isVisible, setIsVisible] = useState(false)

  return (
    <Input
      {...props}
      type={isVisible ? 'text' : 'password'}
      autoComplete={autoComplete}
      autoCapitalize="none"
      spellCheck={false}
      disabled={disabled}
      trailing={
        <Button
          icon={isVisible ? 'eye-off' : 'eye'}
          variant="ghost"
          size="sm"
          disabled={disabled}
          aria-label={
            isVisible ? t('passwordInput.hide') : t('passwordInput.show')
          }
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
        />
      }
    />
  )
}
