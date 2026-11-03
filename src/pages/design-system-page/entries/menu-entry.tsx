import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { ButtonVariant, MenuItem } from '@/components'
import { Menu } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'
import styles from './entries.module.scss'

const VARIANTS: ButtonVariant[] = ['secondary', 'primary', 'subtle', 'ghost']

function ignore() {}

const SORT_ORDERS = ['newest', 'oldest', 'name'] as const

type SortOrder = (typeof SORT_ORDERS)[number]

export function MenuEntry() {
  const { t } = useTranslation('designSystem')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const items: MenuItem[] = [
    { id: 'edit', label: t('samples.edit'), icon: 'edit', onSelect: ignore },
    {
      id: 'duplicate',
      label: t('samples.duplicate'),
      icon: 'copy',
      onSelect: ignore,
    },
    {
      id: 'archive',
      label: t('samples.archive'),
      icon: 'inbox',
      onSelect: ignore,
      isDisabled: true,
    },
    {
      id: 'delete',
      label: t('samples.delete'),
      icon: 'trash',
      tone: 'danger',
      onSelect: ignore,
    },
  ]

  return (
    <>
      <ShowcaseSection title={t('sections.variants')}>
        <div className={styles.popupRoom}>
          <SpecimenRow>
            {VARIANTS.map((variant) => (
              <Specimen key={variant} label={variant}>
                <Menu
                  label={t('samples.options')}
                  variant={variant}
                  items={items}
                />
              </Specimen>
            ))}
          </SpecimenRow>
        </div>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.iconOnly')}>
        <div className={styles.popupRoom}>
          <SpecimenRow>
            <Specimen label="isLabelHidden">
              <Menu
                label={t('samples.more')}
                icon="more-horizontal"
                variant="ghost"
                isLabelHidden
                items={items}
              />
            </Specimen>
            <Specimen label="icon">
              <Menu
                label={t('samples.options')}
                icon="settings"
                items={items}
              />
            </Specimen>
          </SpecimenRow>
        </div>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.checked')}>
        <div className={styles.popupRoom}>
          <Specimen label="isChecked">
            <Menu
              label={t('samples.sortBy')}
              icon="sort-descending"
              items={SORT_ORDERS.map((order) => ({
                id: order,
                label: t(`samples.sortOrders.${order}`),
                isChecked: sortOrder === order,
                onSelect: () => setSortOrder(order),
              }))}
            />
          </Specimen>
        </div>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.alignment')}>
        <div className={styles.popupRoom}>
          <SpecimenRow>
            <Specimen label="start">
              <Menu label={t('samples.options')} align="start" items={items} />
            </Specimen>
            <Specimen label="end">
              <Menu label={t('samples.options')} align="end" items={items} />
            </Specimen>
          </SpecimenRow>
        </div>
      </ShowcaseSection>
    </>
  )
}
