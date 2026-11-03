import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'
import { Link as RouterLink } from 'react-router'

import { Heading, Icon } from '@/components'
import type { IconName } from '@/components/icon/icon-paths'
import semantic from '@/styles/tokens/_semantic.scss?raw'
import { parseTokens } from '@/styles/tokens/parse-tokens'

import styles from './design-system-overview.module.scss'
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
    <div className={styles.root}>
      <header className={styles.hero}>
        <span className={styles.eyebrow}>{t('overview.eyebrow')}</span>
        <Heading
          ref={titleRef}
          className={styles.title}
          level={1}
          tabIndex={-1}
        >
          {t('overview.title')}
        </Heading>
        <p className={styles.lead}>{t('overview.lead')}</p>
        <div className={styles.actions}>
          {FIRST_COMPONENT && (
            <RouterLink
              className={styles.primaryAction}
              to={getEntryPath(FIRST_COMPONENT.id)}
            >
              {t('overview.browse')}
              <Icon name="arrow-right" size="sm" />
            </RouterLink>
          )}
          <RouterLink
            className={styles.secondaryAction}
            to={getEntryPath(SHOWCASE_ENTRIES[0].id)}
          >
            {t('overview.foundations')}
          </RouterLink>
        </div>
        <dl className={styles.stats}>
          {stats.map(({ value, label }) => (
            <div key={label} className={styles.stat}>
              <dt className={styles.statLabel}>{label}</dt>
              <dd className={styles.statValue}>{value}</dd>
            </div>
          ))}
        </dl>
      </header>

      <section className={styles.section} aria-labelledby="principles">
        <Heading id="principles" level={2} size="xl">
          {t('overview.principlesTitle')}
        </Heading>
        <ul className={styles.principles}>
          {principles.map((principle, index) => (
            <li key={principle.title} className={styles.principle}>
              <span className={styles.principleIcon}>
                <Icon name={PRINCIPLE_ICONS[index] ?? 'star'} size="sm" />
              </span>
              <p className={styles.principleTitle}>{principle.title}</p>
              <p className={styles.principleBody}>{principle.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {SHOWCASE_GROUPS.map((group) => {
        const entries = getEntriesInGroup(group)

        return (
          <section
            key={group}
            id={group}
            className={styles.section}
            aria-labelledby={`${group}-title`}
          >
            <div className={styles.groupHeader}>
              <Heading id={`${group}-title`} level={2} size="xl">
                {t(`groups.${group}`)}
              </Heading>
              <p className={styles.groupDescription}>
                {t(`groupDescriptions.${group}`)}
                <span className={styles.count}>
                  {t('overview.count', { count: entries.length })}
                </span>
              </p>
            </div>
            <ul className={styles.grid}>
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
    <RouterLink className={styles.card} to={getEntryPath(entry.id)}>
      <span className={styles.cardName}>
        {entry.name}
        <Icon className={styles.cardArrow} name="arrow-right" size="sm" />
      </span>
      <span className={styles.cardDescription}>{description}</span>
    </RouterLink>
  )
}
