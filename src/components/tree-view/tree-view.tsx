import type { CSSProperties, KeyboardEvent } from 'react'
import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/icon/icon'
import type { IconName } from '@/components/icon/icon-paths'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './tree-view.module.scss'

export type TreeNode = {
  id: string
  label: string
  icon?: IconName
  children?: TreeNode[]
  isDisabled?: boolean
}

export type TreeViewProps = {
  label: string
  nodes: TreeNode[]
  expandedIds?: string[]
  defaultExpandedIds?: string[]
  onExpandedChange?: (ids: string[]) => void
  selectedId?: string | null
  defaultSelectedId?: string | null
  onSelect?: (id: string) => void
  className?: string
}

type VisibleNode = {
  node: TreeNode
  level: number
  parentId?: string
  position: number
  setSize: number
}

function flatten(
  nodes: TreeNode[],
  expanded: Set<string>,
  level = 1,
  parentId?: string,
): VisibleNode[] {
  return nodes.flatMap((node, index) => [
    { node, level, parentId, position: index + 1, setSize: nodes.length },
    ...(node.children && expanded.has(node.id)
      ? flatten(node.children, expanded, level + 1, node.id)
      : []),
  ])
}

export function TreeView({
  label,
  nodes,
  expandedIds,
  defaultExpandedIds = [],
  onExpandedChange,
  selectedId: selectedIdProp,
  defaultSelectedId = null,
  onSelect,
  className,
}: TreeViewProps) {
  const itemRefs = useRef(new Map<string, HTMLLIElement>())
  const shouldFocus = useRef(false)
  const [expanded, setExpanded] = useControllableState({
    value: expandedIds,
    defaultValue: defaultExpandedIds,
    onChange: onExpandedChange,
  })
  const [selectedId, setSelectedId] = useControllableState<string | null>({
    value: selectedIdProp,
    defaultValue: defaultSelectedId,
    onChange: (id) => id && onSelect?.(id),
  })
  const expandedSet = new Set(expanded)
  const visible = flatten(nodes, expandedSet)
  const [focusedId, setFocusedId] = useState(
    () => selectedId ?? visible[0]?.node.id,
  )
  const tabStopId = visible.some(({ node }) => node.id === focusedId)
    ? focusedId
    : visible[0]?.node.id

  useEffect(() => {
    if (shouldFocus.current && focusedId) {
      itemRefs.current.get(focusedId)?.focus()
      shouldFocus.current = false
    }
  }, [focusedId])

  function focus(id: string) {
    shouldFocus.current = true
    setFocusedId(id)
    itemRefs.current.get(id)?.focus()
  }

  function toggle(id: string, isOpen: boolean) {
    setExpanded(
      isOpen ? [...expanded, id] : expanded.filter((current) => current !== id),
    )
  }

  function select(node: TreeNode) {
    if (!node.isDisabled) {
      setSelectedId(node.id)
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const index = visible.findIndex(({ node }) => node.id === tabStopId)
    const current = visible[index]

    if (!current) {
      return
    }

    const { node, parentId } = current
    const hasChildren = Boolean(node.children?.length)
    const isOpen = expandedSet.has(node.id)
    const actions: Record<string, () => void> = {
      ArrowDown: () => visible[index + 1] && focus(visible[index + 1].node.id),
      ArrowUp: () => visible[index - 1] && focus(visible[index - 1].node.id),
      Home: () => focus(visible[0].node.id),
      End: () => focus(visible[visible.length - 1].node.id),
      ArrowRight: () => {
        if (hasChildren && !isOpen) {
          toggle(node.id, true)
        } else if (hasChildren && node.children) {
          focus(node.children[0].id)
        }
      },
      ArrowLeft: () => {
        if (hasChildren && isOpen) {
          toggle(node.id, false)
        } else if (parentId) {
          focus(parentId)
        }
      },
      Enter: () => select(node),
      ' ': () => select(node),
    }
    const action = actions[event.key]

    if (action) {
      event.preventDefault()
      action()
    } else if (event.key.length === 1 && /\S/.test(event.key)) {
      const key = event.key.toLocaleLowerCase()
      const ordered = [...visible.slice(index + 1), ...visible.slice(0, index)]
      const match = ordered.find((item) =>
        item.node.label.toLocaleLowerCase().startsWith(key),
      )

      if (match) {
        focus(match.node.id)
      }
    }
  }

  function renderNodes(list: TreeNode[], level: number) {
    return list.map((node, index) => {
      const hasChildren = Boolean(node.children?.length)
      const isOpen = expandedSet.has(node.id)
      const style = { '--tree-level': level - 1 } as CSSProperties

      return (
        <li
          key={node.id}
          ref={(element) => {
            if (element) {
              itemRefs.current.set(node.id, element)
            } else {
              itemRefs.current.delete(node.id)
            }
          }}
          className={styles.item}
          role="treeitem"
          aria-level={level}
          aria-setsize={list.length}
          aria-posinset={index + 1}
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-selected={node.id === selectedId}
          aria-disabled={node.isDisabled || undefined}
          tabIndex={node.id === tabStopId ? 0 : -1}
          onFocus={(event) => {
            if (event.target === event.currentTarget) {
              setFocusedId(node.id)
            }
          }}
        >
          <div
            className={styles.row}
            style={style}
            onClick={() => {
              focus(node.id)
              select(node)

              if (hasChildren) {
                toggle(node.id, !isOpen)
              }
            }}
          >
            <span className={styles.toggle} aria-hidden="true">
              {hasChildren && (
                <Icon
                  className={cx(styles.chevron, isOpen && styles.open)}
                  name="chevron-right"
                  size="sm"
                />
              )}
            </span>
            {node.icon && (
              <Icon className={styles.icon} name={node.icon} size="sm" />
            )}
            <span className={styles.label}>{node.label}</span>
          </div>
          {hasChildren && isOpen && node.children && (
            <ul className={styles.group} role="group">
              {renderNodes(node.children, level + 1)}
            </ul>
          )}
        </li>
      )
    })
  }

  return (
    <ul
      className={cx(styles.root, className)}
      role="tree"
      aria-label={label}
      onKeyDown={handleKeyDown}
    >
      {renderNodes(nodes, 1)}
    </ul>
  )
}
