import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FileUpload } from '@/components'

export function FileUploadUsage() {
  const { t } = useTranslation('designSystem')
  const [files, setFiles] = useState<File[]>([])

  return (
    <FileUpload
      label={t('samples.attachmentsLabel')}
      hint={t('samples.attachmentsHint')}
      accept="image/png,application/pdf"
      isMultiple
      value={files}
      onChange={setFiles}
    />
  )
}
