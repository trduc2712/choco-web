import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { Dialog } from '@/components/dialog/dialog'
import { Textarea } from '@/components/textarea/textarea'

import {
  BIO_MAX_LENGTH,
  bioLength,
  isBioTooLongError,
  useUpdateBio,
} from './use-update-bio'

export function BioEditor({
  bio,
  isReadOnly = false,
  onClose,
}: {
  bio: string | null | undefined
  isReadOnly?: boolean
  onClose: () => void
}) {
  const { t } = useTranslation()
  const formId = useId()
  const [draft, setDraft] = useState(bio ?? '')
  const { mutate, isPending, error, reset } = useUpdateBio()
  const length = bioLength(draft)
  const isTooLong = length > BIO_MAX_LENGTH
  const isUnchanged = draft.trim() === (bio ?? '')
  const tooLongMessage = t('profile.bioTooLong', { max: BIO_MAX_LENGTH })

  function save(value: string | null) {
    mutate(value, {
      onSuccess: onClose,
    })
  }

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title={t('profile.editProfile')}
      footer={
        <Button
          type="submit"
          form={formId}
          isLoading={isPending}
          disabled={isTooLong || isUnchanged || isReadOnly}
        >
          {t('profile.bioSave')}
        </Button>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault()
          if (!isTooLong && !isUnchanged && !isReadOnly && !isPending) {
            save(draft.trim() === '' ? null : draft)
          }
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
      </form>
    </Dialog>
  )
}
