import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Textarea } from '@/components/textarea/textarea'

import styles from './bio-editor.module.scss'
import {
  BIO_MAX_LENGTH,
  bioLength,
  isBioTooLongError,
  useUpdateBio,
} from './use-update-bio'

export function BioEditor({
  bio,
  isReadOnly = false,
  onDone,
}: {
  bio: string | null | undefined
  isReadOnly?: boolean
  onDone?: () => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(bio ?? '')
  const { mutate, isPending, error, reset } = useUpdateBio()
  const length = bioLength(draft)
  const isTooLong = length > BIO_MAX_LENGTH
  const isUnchanged = draft.trim() === (bio ?? '')
  const tooLongMessage = t('profile.bioTooLong', { max: BIO_MAX_LENGTH })

  function save(value: string | null) {
    mutate(value, {
      onSuccess: () => onDone?.(),
    })
  }

  return (
    <form
      className={styles.root}
      onSubmit={(event) => {
        event.preventDefault()
        if (!isTooLong && !isUnchanged) save(draft.trim() === '' ? null : draft)
      }}
    >
      <Textarea
        label={t('profile.bioLabel')}
        placeholder={t('profile.bioPlaceholder')}
        rows={4}
        value={draft}
        hint={t('profile.bioCounter', { length, max: BIO_MAX_LENGTH })}
        error={
          isTooLong || isBioTooLongError(error)
            ? tooLongMessage
            : error
              ? t('profile.bioSaveError')
              : undefined
        }
        onChange={(event) => {
          setDraft(event.target.value)
          if (error) reset()
        }}
      />
      <div className={styles.actions}>
        <Button
          type="submit"
          isLoading={isPending}
          disabled={isTooLong || isUnchanged || isReadOnly}
        >
          {t('profile.bioSave')}
        </Button>
      </div>
    </form>
  )
}
