import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components'

import { ShowcaseSection, Specimen, SpecimenRow } from '../showcase-section'

const INVITE_CODE = 'invite-code'

export function CopyButtonEntry() {
  const { t } = useTranslation('designSystem')

  return (
    <>
      <ShowcaseSection title={t('sections.iconOnly')}>
        <SpecimenRow>
          <Specimen label="ghost">
            <CopyButton
              value={INVITE_CODE}
              label={t('samples.copyInviteCode')}
            />
          </Specimen>
          <Specimen label="secondary">
            <CopyButton
              value={INVITE_CODE}
              label={t('samples.copyInviteCode')}
              variant="secondary"
              size="md"
            />
          </Specimen>
        </SpecimenRow>
      </ShowcaseSection>
      <ShowcaseSection title={t('sections.withLabel')}>
        <Specimen label="isLabelShown">
          <CopyButton
            value={INVITE_CODE}
            label={t('samples.copyLink')}
            variant="secondary"
            size="md"
            isLabelShown
          />
        </Specimen>
      </ShowcaseSection>
    </>
  )
}
