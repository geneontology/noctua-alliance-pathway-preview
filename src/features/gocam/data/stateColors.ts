interface StateColor {
  chip: string
  circle: string
}

/**
 * The Angular `noc-chip-color($color)` mixin: a 1px border in the color, the
 * color at 20% opacity as the background, and the icon circle filled solid.
 * Colors are the ones from the pathway component SCSS.
 */
const STATE_COLORS: Record<string, StateColor> = {
  development: {
    chip: 'border-noc-chip-development bg-noc-chip-development/20',
    circle: 'bg-noc-chip-development text-noc-chip-icon',
  },
  production: {
    chip: 'border-noc-chip-production bg-noc-chip-production/20',
    circle: 'bg-noc-chip-production text-noc-chip-icon',
  },
  review: {
    chip: 'border-noc-chip-review bg-noc-chip-review/20',
    circle: 'bg-noc-chip-review text-noc-chip-icon',
  },
}

const DEFAULT_STATE_COLOR: StateColor = {
  chip: 'border-noc-chip-default bg-noc-chip-default/20',
  circle: 'bg-noc-chip-default text-noc-chip-icon',
}

export function getStateColor(stateName?: string): StateColor {
  if (!stateName) return DEFAULT_STATE_COLOR
  return STATE_COLORS[stateName] ?? DEFAULT_STATE_COLOR
}
