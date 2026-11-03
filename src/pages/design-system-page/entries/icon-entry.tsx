import { useDeferredValue, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { IconName, IconSize } from '@/components'
import {
  Button,
  getIconsInCategory,
  Icon,
  ICON_CATEGORY_NAMES,
  ICON_NAMES,
  Input,
  useToast,
} from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'
import styles from './icon-entry.module.scss'

const SIZES: IconSize[] = ['sm', 'md', 'lg', 'xl']

function matches(name: IconName, query: string) {
  const needle = query.trim().toLowerCase().replace(/\s+/g, '-')

  return name.includes(needle)
}

export function IconEntry() {
  const { t } = useTranslation('designSystem')
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const matchCount = ICON_NAMES.filter((name) =>
    matches(name, deferredQuery),
  ).length

  async function copy(name: IconName) {
    const snippet = `<Icon name="${name}" />`

    try {
      await navigator.clipboard.writeText(snippet)
      showToast({
        tone: 'success',
        title: t('samples.iconCopied'),
        description: snippet,
        duration: 2500,
      })
    } catch {
      showToast({ tone: 'danger', title: t('samples.iconCopyFailed') })
    }
  }

  return (
    <>
      <ShowcaseSection title={t('sections.sizes')}>
        <SpecimenRow>
          {SIZES.map((size) => (
            <Specimen key={size} label={size}>
              <Icon name="star" size={size} />
            </Specimen>
          ))}
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.inContext')}>
        <SpecimenRow>
          <Specimen label="iconStart">
            <Button iconStart="download">{t('samples.download')}</Button>
          </Specimen>
          <Specimen label="icon">
            <Button
              icon="settings"
              variant="secondary"
              aria-label={t('samples.settings')}
            />
          </Specimen>
          <Specimen label="Input icon">
            <Input
              label={t('samples.searchLabel')}
              icon="search"
              placeholder={t('samples.searchLabel')}
              isLabelHidden
            />
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.labelled')}>
        <Specimen label="label">
          <Icon name="star" label={t('samples.favorited')} />
        </Specimen>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.allIcons')}>
        <div className={styles.toolbar}>
          <div className={styles.search}>
            <Input
              label={t('samples.iconSearch')}
              icon="search"
              type="search"
              placeholder={t('samples.iconSearchPlaceholder', {
                count: ICON_NAMES.length,
              })}
              value={query}
              isLabelHidden
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <p className={styles.count} role="status">
            {t('samples.iconCount', { count: matchCount })}
          </p>
        </div>
        <p className={styles.hint}>{t('samples.iconHint')}</p>
        {matchCount === 0 && (
          <p className={styles.empty}>
            {t('samples.iconEmpty', { query: deferredQuery.trim() })}
          </p>
        )}
        {ICON_CATEGORY_NAMES.map((category) => {
          const names = getIconsInCategory(category).filter((name) =>
            matches(name, deferredQuery),
          )

          if (names.length === 0) {
            return null
          }

          return (
            <div key={category} className={styles.category}>
              <p className={styles.categoryName}>
                {t(`iconCategories.${category}`)}
                <span className={styles.categoryCount}>{names.length}</span>
              </p>
              <ul className={styles.grid}>
                {names.map((name) => (
                  <li key={name}>
                    <button
                      className={styles.tile}
                      type="button"
                      title={name}
                      onClick={() => void copy(name)}
                    >
                      <Icon name={name} size="lg" />
                      <span className={styles.name}>{name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </ShowcaseSection>
    </>
  )
}
