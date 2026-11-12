import { Fragment } from 'react'

import { splitByMatches } from './find-matches'
import styles from './highlight.module.scss'

export type HighlightProps = {
  text: string
  // Words to mark in the text, separated by spaces. Case and accents do not
  // matter.
  query: string
  // Look for the whole query as one phrase, not word by word.
  isPhrase?: boolean
}

// The text with the words of a search marked, so it is clear why a result
// matched.
export function Highlight({ text, query, isPhrase = false }: HighlightProps) {
  return (
    <>
      {splitByMatches(text, query, isPhrase).map((part, index) =>
        part.isMatch ? (
          <mark key={index} className={styles.mark}>
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  )
}
