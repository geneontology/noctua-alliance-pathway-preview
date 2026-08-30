import type React from 'react'
import { useMemo } from 'react'
import { FaCalendarDay, FaTasks } from 'react-icons/fa'
import Chip from '@/@noctua.core/components/chip/Chip'
import ContributorChips from './ContributorChips'
import ToolbarLinkMenu from './ToolbarLinkMenu'
import { getStateColor } from '../data/stateColors'
import { useModelUrls } from '../hooks/useModelUrls'
import { resolveContributor } from '../services/modelMetadata'
import type { ModelMeta } from '../models/model'
import { useAppSelector } from '@/app/hooks'
import { selectBaristaToken } from '@/features/auth/slices/authSlice'

const DATE_CHIP = 'border-noc-chip-date bg-noc-chip-date/20'
const DATE_CIRCLE = 'bg-noc-chip-date text-noc-chip-icon'

interface ModelBarProps {
  meta: ModelMeta
}

/**
 * Read-only port of the Angular `noc-cam-toolbar`. The edit pencils, comments
 * button and copy-model button are intentionally absent — this app never writes.
 */
const ModelBar: React.FC<ModelBarProps> = ({ meta }) => {
  const baristaToken = useAppSelector(selectBaristaToken)
  const knownContributors = useAppSelector(state => state.metadata.contributors)
  const urls = useModelUrls(meta.id, baristaToken)

  // Model annotations carry bare ORCID URIs; names appear once /users lands.
  const contributors = useMemo(
    () => meta.contributors.map(c => resolveContributor(c.uri, knownContributors)),
    [meta.contributors, knownContributors]
  )

  const stateColor = getStateColor(meta.state)

  return (
    <div className="mb-1 flex h-10 w-full shrink-0 items-center gap-3 overflow-hidden bg-white px-[10px] text-xs shadow-md">
      {meta.title && (
        <div className="max-w-[250px] shrink-0 truncate px-2" title={meta.title}>
          <strong>Title: </strong>
          {meta.title}
        </div>
      )}

      {meta.state && (
        <Chip
          icon={<FaTasks size={11} />}
          chipClass={stateColor.chip}
          circleClass={stateColor.circle}
          className="shrink-0"
        >
          {meta.state}
        </Chip>
      )}

      {meta.date && (
        <Chip
          icon={<FaCalendarDay size={11} />}
          chipClass={DATE_CHIP}
          circleClass={DATE_CIRCLE}
          className="shrink-0"
        >
          {meta.date}
        </Chip>
      )}

      <ContributorChips contributors={contributors} />

      {urls && (
        <div className="flex shrink-0 items-center gap-2">
          <ToolbarLinkMenu
            label="VIEW IN"
            items={[
              { label: 'Annotation Preview', href: urls.annotationPreview },
              { label: 'Visual Pathway Editor', href: urls.visualPathwayEditor },
              { label: 'Standard Annotations Editor', href: urls.standardAnnotations },
              { label: 'Graph Editor', href: urls.graphEditor },
            ]}
          />
          <ToolbarLinkMenu
            label="EXPORT AS"
            items={[
              { label: 'GPAD', href: urls.gpad },
              { label: 'OWL', href: urls.owl },
            ]}
          />
        </div>
      )}
    </div>
  )
}

export default ModelBar
