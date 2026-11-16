import { useTranslation } from 'react-i18next'

export function ReportTime({
  value,
  className,
}: {
  value: string
  className?: string
}) {
  const { i18n } = useTranslation()
  const formatted = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

  return (
    <time className={className} dateTime={value}>
      {formatted}
    </time>
  )
}
