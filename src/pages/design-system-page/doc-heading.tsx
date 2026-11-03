import { Heading, Icon } from '@/components'

import styles from './doc-heading.module.scss'

type DocHeadingProps = {
  level: 2 | 3
  id: string
  children: string
}

export function DocHeading({ level, id, children }: DocHeadingProps) {
  return (
    <Heading
      id={id}
      className={styles.root}
      level={level}
      size={level === 2 ? 'xl' : 'md'}
      data-toc={level}
    >
      {children}
      <a
        className={styles.anchor}
        href={`#${id}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <Icon name="hash" size="sm" />
      </a>
    </Heading>
  )
}
