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
        className={className}
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

export function FormSubmit({ children }: { children: ReactNode }) {
  const { formState } = useFormContext()
  return (
    <button
      type="submit"
      disabled={formState.isSubmitting}
      aria-busy={formState.isSubmitting || undefined}
    >
      {children}
    </button>
  )
}
