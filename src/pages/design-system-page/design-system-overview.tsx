import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Heading, Icon } from '@/components'
import type { IconName } from '@/components/icon/icon-paths'
import semantic from '@/styles/tokens/_semantic.scss?raw'
import { parseTokens } from '@/styles/tokens/parse-tokens'

import { useEntryDocs } from './entry-docs'
import type { ShowcaseEntry } from './showcase-entries'
import {
  getEntriesInGroup,
  getEntryPath,
  SHOWCASE_ENTRIES,
  SHOWCASE_GROUPS,
} from './showcase-entries'

const PRINCIPLE_ICONS: IconName[] = ['check-circle', 'settings', 'eye']

const COLOR_TOKEN_COUNT = [...parseTokens(semantic).keys()].filter((name) =>
  name.startsWith('--color-'),
).length

const COMPONENT_COUNT = SHOWCASE_ENTRIES.filter(
  (entry) => entry.group !== 'foundations',
).length

const FIRST_COMPONENT = SHOWCASE_ENTRIES.find(
  (entry) => entry.group !== 'foundations',
)

type DesignSystemOverviewProps = {
  titleRef: Ref<HTMLHeadingElement>
}

export function DesignSystemOverview({ titleRef }: DesignSystemOverviewProps) {
  const { t } = useTranslation('designSystem')
  const principles = t('overview.principles', { returnObjects: true })

  const stats = [
    { value: String(COMPONENT_COUNT), label: t('overview.stats.components') },
    { value: String(COLOR_TOKEN_COUNT), label: t('overview.stats.tokens') },
    { value: '2', label: t('overview.stats.themes') },
    {
      value: t('overview.stats.standard'),
      label: t('overview.stats.standardLabel'),
    },
  ]

  return (
    <div>
      <header>
        <span>{t('overview.eyebrow')}</span>
        <Heading ref={titleRef} level={1} tabIndex={-1}>
          {t('overview.title')}
        </Heading>
        <p>{t('overview.lead')}</p>
        <div>
          {FIRST_COMPONENT && (
            <RouterLink to={getEntryPath(FIRST_COMPONENT.id)}>
              {t('overview.browse')}
              <Icon name="arrow-right" size="sm" />
            </RouterLink>
          )}
          <RouterLink to={getEntryPath(SHOWCASE_ENTRIES[0].id)}>
            {t('overview.foundations')}
          </RouterLink>
        </div>
        <dl>
          {stats.map(({ value, label }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section aria-labelledby="principles">
        <Heading id="principles" level={2} size="xl">
          {t('overview.principlesTitle')}
        </Heading>
        <ul>
          {principles.map((principle, index) => (
            <li key={principle.title}>
              <span>
                <Icon name={PRINCIPLE_ICONS[index] ?? 'star'} size="sm" />
              </span>
              <p>{principle.title}</p>
              <p>{principle.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {SHOWCASE_GROUPS.map((group) => {
        const entries = getEntriesInGroup(group)

        return (
          <section key={group} id={group} aria-labelledby={`${group}-title`}>
            <div>
              <Heading id={`${group}-title`} level={2} size="xl">
                {t(`groups.${group}`)}
              </Heading>
              <p>
                {t(`groupDescriptions.${group}`)}
                <span>{t('overview.count', { count: entries.length })}</span>
              </p>
            </div>
            <ul>
              {entries.map((entry) => (
                <li key={entry.id}>
                  <EntryCard entry={entry} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

type EntryCardProps = {
  entry: ShowcaseEntry
}

function EntryCard({ entry }: EntryCardProps) {
  const { description } = useEntryDocs(entry.id)

  return (
    <RouterLink to={getEntryPath(entry.id)}>
      <span>
        {entry.name}
        <Icon name="arrow-right" size="sm" />
      </span>
      <span>{description}</span>
    </RouterLink>
  )
}
