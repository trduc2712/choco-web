import type { ReactNode } from 'react'

import { Stack } from '@/components'
import { slugify } from '@/lib/slugify'

import { DocHeading } from './doc-heading'
import styles from './showcase-section.module.scss'

type ShowcaseSectionProps = {
  title: string
  children: ReactNode
}

type SpecimenProps = {
  label: string
  isStretched?: boolean
  children: ReactNode
}

type SpecimenRowProps = {
  children: ReactNode
}

export function ShowcaseSection({ title, children }: ShowcaseSectionProps) {
  return (
    <Stack as="section" gap={3}>
      <DocHeading level={3} id={slugify(title)}>
        {title}
      </DocHeading>
      <div className={styles.canvas}>{children}</div>
    </Stack>
  )
}

export function Specimen({
  label,
  isStretched = false,
  children,
}: SpecimenProps) {
  return (
    <Stack
      gap={2}
      align={isStretched ? 'stretch' : 'start'}
      className={styles.specimen}
    >
      {children}
      <code className={styles.caption}>{label}</code>
    </Stack>
  )
}

export function SpecimenRow({ children }: SpecimenRowProps) {
  return (
    <Stack direction="row" gap={5} align="end" isWrapping>
      {children}
    </Stack>
  )
}
