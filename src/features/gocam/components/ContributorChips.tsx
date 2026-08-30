import type React from 'react'
import { FaUser } from 'react-icons/fa'
import { usePopover } from '@/@noctua.core/hooks/usePopover'
import AnchoredMenu, { MenuItem } from '@/@noctua.core/components/menu/AnchoredMenu'
import Chip from '@/@noctua.core/components/chip/Chip'
import type { Contributor } from '@/features/users/models/contributor'

const MAX_VISIBLE = 2

const USER_CHIP = 'border-noc-chip-user bg-noc-chip-user/20'
const USER_CIRCLE = 'bg-noc-chip-user text-noc-chip-user-icon'

interface ContributorChipsProps {
  contributors: Contributor[]
}

const ContributorChips: React.FC<ContributorChipsProps> = ({ contributors }) => {
  const overflowMenu = usePopover()

  const visible = contributors.slice(0, MAX_VISIBLE)
  const hidden = contributors.slice(MAX_VISIBLE)

  return (
    // overflow-hidden, not overflow-x-auto: a horizontal scrollbar inside a
    // 40px-tall bar looks broken, and the "+N more" menu below already covers
    // the overflow case.
    <div className="flex min-w-0 grow items-center overflow-hidden">
      <div className="flex flex-nowrap gap-2">
        {visible.map(contributor => (
          <Chip
            key={contributor.uri}
            icon={<FaUser size={11} />}
            chipClass={USER_CHIP}
            circleClass={USER_CIRCLE}
            className="max-w-[200px]"
          >
            {contributor.name}
          </Chip>
        ))}

        {hidden.length > 0 && (
          <>
            <button
              className={`flex h-[25px] cursor-pointer items-center rounded-full border px-3 text-2xs transition-shadow hover:shadow-sm hover:brightness-95 ${USER_CHIP}`}
              onClick={e => overflowMenu.open(e.currentTarget)}
            >
              +{hidden.length} more
            </button>
            <AnchoredMenu
              anchorEl={overflowMenu.anchor}
              open={overflowMenu.isOpen}
              onClose={overflowMenu.close}
            >
              {hidden.map(contributor => (
                <MenuItem key={contributor.uri} onClick={overflowMenu.close}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-noc-chip-user text-noc-chip-user-icon">
                      <FaUser size={11} />
                    </div>
                    <span>{contributor.name}</span>
                  </div>
                </MenuItem>
              ))}
            </AnchoredMenu>
          </>
        )}
      </div>
    </div>
  )
}

export default ContributorChips
