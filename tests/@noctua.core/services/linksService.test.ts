import { describe, expect, it } from 'vitest'
import { getBaristaApiUrl } from '@/@noctua.core/services/linksService'

describe('getBaristaApiUrl', () => {
  it('uses the privileged endpoint when there is a token', () => {
    expect(getBaristaApiUrl('tok-123')).toBe(
      'http://localhost:3400/api/minerva_local/m3BatchPrivileged'
    )
  })

  it('uses the public endpoint without one', () => {
    expect(getBaristaApiUrl('')).toBe('http://localhost:3400/api/minerva_local/m3Batch')
  })
})
