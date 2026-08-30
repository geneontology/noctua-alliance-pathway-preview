import type React from 'react'

interface ChipProps {
  icon: React.ReactNode
  chipClass: string
  circleClass: string
  onClick?: () => void
  trailing?: React.ReactNode
  className?: string
  children: React.ReactNode
}

// Geometry of the Angular `mat-chip.noc-table-chip`: 25px tall, 10px text,
// with a 25px circular icon well on the leading edge.
const BASE = 'flex h-[25px] items-center rounded-full border text-2xs'
const CIRCLE =
  'flex h-[25px] w-[25px] flex-shrink-0 items-center justify-center rounded-full text-2xs'
const INTERACTIVE = 'cursor-pointer transition-shadow hover:shadow-sm hover:brightness-95'

const Chip: React.FC<ChipProps> = ({
  icon,
  chipClass,
  circleClass,
  onClick,
  trailing,
  className = '',
  children,
}) => {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`${BASE} ${chipClass} ${onClick ? INTERACTIVE : ''} ${trailing ? 'pr-1' : 'pr-2'} ${className}`}
    >
      <div className={`${CIRCLE} ${circleClass}`}>{icon}</div>
      <span className="grow truncate pr-2 pl-1">{children}</span>
      {trailing}
    </Tag>
  )
}

export default Chip
