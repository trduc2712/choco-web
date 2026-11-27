import { Heading, Icon } from '@/components'

type DocHeadingProps = {
  level: 2 | 3
  id: string
  children: string
}

export function DocHeading({ level, id, children }: DocHeadingProps) {
  return (
    <Heading
      id={id}
      level={level}
      size={level === 2 ? 'xl' : 'md'}
      data-toc={level}
    >
      {children}
      <a href={`#${id}`} tabIndex={-1} aria-hidden="true">
        <Icon name="hash" size="sm" />
      </a>
    </Heading>
  )
}
