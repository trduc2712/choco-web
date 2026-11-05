import { describe, expect, test } from 'vitest'

import { FALLBACK_LANGUAGE, LANGUAGES } from './languages'

type Messages = { [key: string]: string | Messages }

const files = import.meta.glob<Messages>('./locales/*/*.json', {
  eager: true,
  import: 'default',
})

function readLocale(language: string, namespace: string): Messages | undefined {
  return files[`./locales/${language}/${namespace}.json`]
}

function flatten(messages: Messages, prefix = ''): Map<string, string> {
  return new Map(
    Object.entries(messages).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key

      return typeof value === 'string'
        ? [[path, value]]
        : [...flatten(value, path)]
    }),
  )
}

function placeholders(message: string): string[] {
  return [...message.matchAll(/{{\s*(\w+)\s*}}/g)]
    .map(([, name]) => name)
    .sort()
}

const namespaces = Object.keys(files)
  .filter((path) => path.startsWith(`./locales/${FALLBACK_LANGUAGE}/`))
  .map((path) => path.split('/').at(-1)!.replace('.json', ''))

const translatedNamespaces = namespaces.filter((namespace) =>
  LANGUAGES.some(
    (language) =>
      language !== FALLBACK_LANGUAGE && readLocale(language, namespace),
  ),
)

describe.each(LANGUAGES.filter((language) => language !== FALLBACK_LANGUAGE))(
  '%s',
  (language) => {
    test.each(translatedNamespaces)(
      '%s has the same keys as English',
      (namespace) => {
        const english = flatten(readLocale(FALLBACK_LANGUAGE, namespace)!)
        const translation = readLocale(language, namespace)

        expect(
          translation,
          `missing ${language}/${namespace}.json`,
        ).toBeDefined()

        const translated = flatten(translation!)

        expect([...translated.keys()].sort()).toEqual(
          [...english.keys()].sort(),
        )
      },
    )

    test.each(translatedNamespaces)(
      '%s keeps every placeholder English uses',
      (namespace) => {
        const english = flatten(readLocale(FALLBACK_LANGUAGE, namespace)!)
        const translated = flatten(readLocale(language, namespace) ?? {})

        for (const [key, message] of translated) {
          expect(placeholders(message), key).toEqual(
            placeholders(english.get(key) ?? ''),
          )
        }
      },
    )
  },
)
