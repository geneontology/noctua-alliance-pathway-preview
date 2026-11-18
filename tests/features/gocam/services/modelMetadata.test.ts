import { describe, expect, it } from 'vitest'
import {
  parseModelMetadata,
  resolveContributor,
  resolveGroup,
} from '@/features/gocam/services/modelMetadata'
import type { Contributor, Group } from '@/features/users/models/contributor'
import { minervaModel } from '@tests/fixtures/minervaModel'

describe('parseModelMetadata', () => {
  it('reads the single-valued header annotations', () => {
    const meta = parseModelMetadata(minervaModel)

    expect(meta.id).toBe('gomodel:5b91dbd100002057')
    expect(meta.title).toBe('Wnt signaling pathway')
    expect(meta.state).toBe('production')
    expect(meta.date).toBe('2025-11-04')
    expect(meta.modified).toBe(true)
  })

  it('collects the repeated annotations', () => {
    const meta = parseModelMetadata(minervaModel)

    expect(meta.comments).toEqual(['Reviewed at the Nov consortium call', 'Second comment'])
    expect(meta.contributors.map(c => c.uri)).toEqual([
      'https://orcid.org/0000-0001-0000-0001',
      'https://orcid.org/0000-0001-0000-0002',
    ])
    expect(meta.groups.map(g => g.id)).toEqual(['http://geneontology.org/gomodel/mgi'])
  })

  it('ignores annotation keys it does not handle', () => {
    const meta = parseModelMetadata(minervaModel)

    // in_taxon is present in the fixture but has no slot on ModelMeta.
    expect(Object.values(meta)).not.toContain('NCBITaxon:10090')
  })

  it('returns an empty shell for a missing or annotation-less model', () => {
    expect(parseModelMetadata(null)).toEqual({
      id: '',
      comments: [],
      contributors: [],
      groups: [],
      modified: false,
    })

    const bare = parseModelMetadata({ id: 'gomodel:abc' })
    expect(bare.id).toBe('gomodel:abc')
    expect(bare.title).toBeUndefined()
    expect(bare.modified).toBe(false)
  })
})

describe('resolveContributor / resolveGroup', () => {
  const known: Contributor[] = [
    { uri: 'https://orcid.org/0000-0001-0000-0001', name: 'Ada Lovelace' },
  ]
  const knownGroups: Group[] = [{ id: 'http://geneontology.org/gomodel/mgi', label: 'MGI' }]

  it('maps a known URI to its display record', () => {
    expect(resolveContributor('https://orcid.org/0000-0001-0000-0001', known).name).toBe(
      'Ada Lovelace'
    )
    expect(resolveGroup('http://geneontology.org/gomodel/mgi', knownGroups).label).toBe('MGI')
  })

  it('falls back to the bare URI when /users has not loaded yet', () => {
    expect(resolveContributor('https://orcid.org/0000-0001-0000-0009', [])).toEqual({
      uri: 'https://orcid.org/0000-0001-0000-0009',
    })
    expect(resolveGroup('unknown-group', [])).toEqual({
      id: 'unknown-group',
      label: 'unknown-group',
    })
  })
})
