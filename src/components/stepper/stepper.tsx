import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

export type StepperOrientation = 'horizontal' | 'vertical'

export type StepperStep = {
  id: string
  label: string
  description?: string
}

export type StepperProps = {
  steps: StepperStep[]
  currentIndex: number
  label?: string
  orientation?: StepperOrientation
  onStepClick?: (index: number) => void
  className?: string
}

type StepStatus = 'complete' | 'current' | 'upcoming'

export function Stepper({
  steps,
  currentIndex,
  label,
  orientation = 'horizontal',
  onStepClick,
  className,
}: StepperProps) {
  const { t } = useTranslation()

  return (
    <nav
      className={cx('stepper-root', `stepper-${orientation}`, className)}
      aria-label={label ?? t('stepper.label')}
    >
      <ol className="stepper-list">
        {steps.map((step, index) => {
          const status: StepStatus =
            index < currentIndex
              ? 'complete'
              : index === currentIndex
                ? 'current'
                : 'upcoming'
          const isClickable = onStepClick !== undefined && status === 'complete'
          const content = (
            <>
              <span className="stepper-marker" aria-hidden="true">
                {status === 'complete' ? (
                  <Icon name="check" size="sm" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="stepper-text">
                <span className="stepper-label">{step.label}</span>
                {step.description && (
                  <span className="stepper-description">
                    {step.description}
                  </span>
                )}
                <VisuallyHidden>, {t(`stepper.${status}`)}</VisuallyHidden>
              </span>
            </>
          )

          return (
            <li
              key={step.id}
              className={cx('stepper-step', `stepper-${status}`)}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              {isClickable ? (
                <button
                  className="stepper-button"
                  type="button"
                  onClick={() => onStepClick(index)}
                >
                  {content}
                </button>
              ) : (
                <span className="stepper-button">{content}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
