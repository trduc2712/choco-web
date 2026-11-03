import { useTranslation } from 'react-i18next'

import { Icon } from '@/components/icon/icon'
import { VisuallyHidden } from '@/components/visually-hidden/visually-hidden'
import { cx } from '@/lib/cx'

import styles from './stepper.module.scss'

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
      className={cx(styles.root, styles[orientation], className)}
      aria-label={label ?? t('stepper.label')}
    >
      <ol className={styles.list}>
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
              <span className={styles.marker} aria-hidden="true">
                {status === 'complete' ? (
                  <Icon name="check" size="sm" />
                ) : (
                  index + 1
                )}
              </span>
              <span className={styles.text}>
                <span className={styles.label}>{step.label}</span>
                {step.description && (
                  <span className={styles.description}>{step.description}</span>
                )}
                <VisuallyHidden>, {t(`stepper.${status}`)}</VisuallyHidden>
              </span>
            </>
          )

          return (
            <li
              key={step.id}
              className={cx(styles.step, styles[status])}
              aria-current={status === 'current' ? 'step' : undefined}
            >
              {isClickable ? (
                <button
                  className={styles.button}
                  type="button"
                  onClick={() => onStepClick(index)}
                >
                  {content}
                </button>
              ) : (
                <span className={styles.button}>{content}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
