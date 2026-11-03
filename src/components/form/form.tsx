import type { ComponentProps, ReactNode } from 'react'
import type {
  ControllerFieldState,
  ControllerRenderProps,
  FieldPath,
  FieldValues,
  SubmitHandler,
  UseFormReturn,
} from 'react-hook-form'
import { FormProvider, useController, useFormContext } from 'react-hook-form'

import type { ButtonProps } from '@/components/button/button'
import { Button } from '@/components/button/button'
import { cx } from '@/lib/cx'

import styles from './form.module.scss'

export type FormProps<Values extends FieldValues> = Omit<
  ComponentProps<'form'>,
  'onSubmit'
> & {
  form: UseFormReturn<Values>
  onSubmit: SubmitHandler<Values>
}

export function Form<Values extends FieldValues>({
  form,
  onSubmit,
  className,
  children,
  ...props
}: FormProps<Values>) {
  return (
    <FormProvider {...form}>
      <form
        {...props}
        className={cx(styles.root, className)}
        noValidate
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
      >
        {children}
      </form>
    </FormProvider>
  )
}

export type FormFieldRenderProps<
  Values extends FieldValues,
  Name extends FieldPath<Values>,
> = {
  field: ControllerRenderProps<Values, Name>
  fieldState: ControllerFieldState
  error?: string
}

export type FormFieldProps<
  Values extends FieldValues,
  Name extends FieldPath<Values>,
> = {
  name: Name
  render: (props: FormFieldRenderProps<Values, Name>) => ReactNode
}

export function FormField<
  Values extends FieldValues,
  Name extends FieldPath<Values>,
>({ name, render }: FormFieldProps<Values, Name>) {
  const { control } = useFormContext<Values>()
  const { field, fieldState } = useController({ name, control })

  return render({ field, fieldState, error: fieldState.error?.message })
}

export type FormSubmitProps = Omit<ButtonProps, 'type' | 'isLoading'>

export function FormSubmit(props: FormSubmitProps) {
  const { formState } = useFormContext()

  return (
    <Button
      {...(props as ButtonProps)}
      type="submit"
      isLoading={formState.isSubmitting}
    />
  )
}
