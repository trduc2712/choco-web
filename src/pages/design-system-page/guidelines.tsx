import { useTranslation } from 'react-i18next'

import { Icon } from '@/components'
import { cx } from '@/lib/cx'

type GuidelinesProps = {
  whenToUse: string[]
  whenNotToUse: string[]
}

export function Guidelines({ whenToUse, whenNotToUse }: GuidelinesProps) {
  const { t } = useTranslation('designSystem')

  return (
    <div>
      <GuidelineCard tone="do" title={t('docs.whenToUse')} items={whenToUse} />
      <GuidelineCard
        tone="dont"
        title={t('docs.whenNotToUse')}
        items={whenNotToUse}
      />
    </div>
  )
}

type GuidelineCardProps = {
  tone: 'do' | 'dont'
  title: string
  items: string[]
}

function GuidelineCard({ tone, title, items }: GuidelineCardProps) {
  return (
    <div className={cx('guidelines-card', `guidelines-${tone}`)}>
      <p>
        <span>
          <Icon name={tone === 'do' ? 'check' : 'close'} size="sm" />
        </span>
        {title}
      </p>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
