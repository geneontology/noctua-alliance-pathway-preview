import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { makeStore } from '@/app/store/store'
import { useGetAllDataQuery } from '@/features/users/slices/metadataApiSlice'
import { fetchedUrls, makeWrapper, mockFetch } from '@tests/test-utils'

const USERS = [
  {
    nickname: 'Ada Lovelace',
    uri: 'https://orcid.org/0000-0001-0000-0001',
    group: 'MGI',
    color: '#abc',
  },
  { nickname: 'Plato', uri: 'https://orcid.org/0000-0001-0000-0002' },
  { uri: 'https://orcid.org/0000-0001-0000-0003' },
]
const GROUPS = [{ id: 'http://geneontology.org/gomodel/mgi', label: 'MGI', shorthand: 'MGI' }]

const renderAllDataQuery = () => {
  const store = makeStore()
  const hook = renderHook(() => useGetAllDataQuery(), { wrapper: makeWrapper(store) })
  return { store, ...hook }
}

describe('getAllData', () => {
  it('loads /users and /groups into the metadata slice', async () => {
    const fetchMock = mockFetch(url => {
      if (url.endsWith('/users')) return { body: USERS }
      if (url.endsWith('/groups')) return { body: GROUPS }
    })
    const { store, result } = renderAllDataQuery()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await waitFor(() => expect(store.getState().metadata.contributors).toHaveLength(3))

    expect(fetchedUrls(fetchMock).sort()).toEqual([
      'http://localhost:3400/groups',
      'http://localhost:3400/users',
    ])
    expect(store.getState().metadata.contributors[0]).toEqual({
      name: 'Ada Lovelace',
      uri: 'https://orcid.org/0000-0001-0000-0001',
      group: 'MGI',
      initials: 'AL',
      color: '#abc',
    })
    expect(store.getState().metadata.groups).toEqual(GROUPS)
  })

  it('derives initials from the first and last word of the nickname', async () => {
    mockFetch(url => (url.endsWith('/users') ? { body: USERS } : { body: [] }))
    const { store, result } = renderAllDataQuery()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await waitFor(() => expect(store.getState().metadata.contributors).toHaveLength(3))

    expect(store.getState().metadata.contributors.map(c => c.initials)).toEqual(['AL', 'P', ''])
  })

  it('leaves the metadata slice empty when either request fails', async () => {
    mockFetch(url => (url.endsWith('/users') ? { body: USERS } : { status: 503 }))
    const { store, result } = renderAllDataQuery()
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(store.getState().metadata.contributors).toEqual([])
    expect(store.getState().metadata.groups).toEqual([])
  })
})
