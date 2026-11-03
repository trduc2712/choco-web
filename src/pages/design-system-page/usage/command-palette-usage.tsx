import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button, CommandPalette } from '@/components'

export function CommandPaletteUsage() {
  const { t } = useTranslation('designSystem')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'j') {
        event.preventDefault()
        setIsOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        {t('samples.openCommands')}
      </Button>
      <CommandPalette
        isOpen={isOpen}
        label={t('samples.commandsLabel')}
        items={[
          { id: 'new-order', label: t('samples.newOrder'), icon: 'plus' },
        ]}
        onClose={() => setIsOpen(false)}
        onSelect={(item) => console.warn(item.id)}
      />
    </>
  )
}
