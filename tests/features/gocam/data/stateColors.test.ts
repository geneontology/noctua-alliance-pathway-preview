import { describe, expect, it } from 'vitest'
import { getStateColor } from '@/features/gocam/data/stateColors'

describe('getStateColor', () => {
  it.each(['development', 'production', 'review'])('has its own color for %s', state => {
    expect(getStateColor(state).chip).toContain(`noc-chip-${state}`)
    expect(getStateColor(state).circle).toContain(`bg-noc-chip-${state}`)
  })

  it('falls back to the default color for missing or unknown states', () => {
    expect(getStateColor(undefined).chip).toContain('noc-chip-default')
    expect(getStateColor('internal_test').chip).toContain('noc-chip-default')
  })
})
