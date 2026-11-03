import type { DragEvent } from 'react'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/button/button'
import { getDescribedBy } from '@/components/field/field-ids'
import { Icon } from '@/components/icon/icon'
import { useControllableState } from '@/hooks/use-controllable-state'
import { cx } from '@/lib/cx'

import styles from './file-upload.module.scss'
import { formatFileSize } from './format-file-size'

export type FileUploadProps = {
  label: string
  value?: File[]
  defaultValue?: File[]
  onChange?: (files: File[]) => void
  accept?: string
  isMultiple?: boolean
  hint?: string
  error?: string
  isDisabled?: boolean
  name?: string
  className?: string
}

function matchesAccept(file: File, accept: string | undefined) {
  if (!accept) {
    return true
  }

  return accept.split(',').some((rule) => {
    const pattern = rule.trim().toLowerCase()

    if (pattern.startsWith('.')) {
      return file.name.toLowerCase().endsWith(pattern)
    }

    return pattern.endsWith('/*')
      ? file.type.startsWith(pattern.slice(0, -1))
      : file.type === pattern
  })
}

export function FileUpload({
  label,
  value: valueProp,
  defaultValue = [],
  onChange,
  accept,
  isMultiple = false,
  hint,
  error,
  isDisabled = false,
  name,
  className,
}: FileUploadProps) {
  const { t, i18n } = useTranslation()
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useControllableState({
    value: valueProp,
    defaultValue,
    onChange,
  })

  function add(incoming: File[]) {
    const accepted = incoming.filter((file) => matchesAccept(file, accept))

    if (accepted.length > 0) {
      setFiles(isMultiple ? [...files, ...accepted] : accepted.slice(0, 1))
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)

    if (!isDisabled) {
      add([...event.dataTransfer.files])
    }
  }

  return (
    <div className={cx(styles.root, className)}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <div
        className={cx(
          styles.dropzone,
          isDragging && styles.dragging,
          error && styles.invalid,
          isDisabled && styles.disabled,
        )}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(!isDisabled)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <Icon className={styles.icon} name="cloud-upload" size="lg" />
        <div className={styles.prompt}>
          <Button
            variant="secondary"
            size="sm"
            disabled={isDisabled}
            onClick={() => inputRef.current?.click()}
            aria-describedby={getDescribedBy(id, hint, error)}
          >
            {t('fileUpload.browse')}
          </Button>
          <span className={styles.drop}>{t('fileUpload.drop')}</span>
        </div>
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          type="file"
          name={name}
          accept={accept}
          multiple={isMultiple}
          disabled={isDisabled}
          tabIndex={-1}
          aria-invalid={error ? true : undefined}
          aria-describedby={getDescribedBy(id, hint, error)}
          onChange={(event) => {
            add([...(event.target.files ?? [])])
            event.target.value = ''
          }}
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={styles.error}>
          <Icon name="alert-circle" size="sm" />
          {error}
        </p>
      )}
      {files.length > 0 && (
        <ul className={styles.files} aria-label={t('fileUpload.selected')}>
          {files.map((file, index) => (
            <li key={`${file.name}-${index}`} className={styles.file}>
              <Icon name="file" size="sm" />
              <span className={styles.fileName}>{file.name}</span>
              <span className={styles.fileSize}>
                {formatFileSize(file.size, i18n.resolvedLanguage)}
              </span>
              <Button
                icon="close"
                variant="ghost"
                size="sm"
                disabled={isDisabled}
                aria-label={t('fileUpload.remove', { name: file.name })}
                onClick={() =>
                  setFiles(files.filter((_, fileIndex) => fileIndex !== index))
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
