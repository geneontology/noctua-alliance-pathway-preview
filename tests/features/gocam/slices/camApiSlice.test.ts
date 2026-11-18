import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { makeStore } from '@/app/store/store'
import { useGetModelQuery } from '@/features/gocam/slices/camApiSlice'
import { minervaModel } from '@tests/fixtures/minervaModel'
import { fetchedUrls, makeWrapper, mockFetch } from '@tests/test-utils'

const MODEL_ID = 'gomodel:5b91dbd100002057'

const renderModelQuery = (baristaToken: string) =>
  renderHook(() => useGetModelQuery({ modelId: MODEL_ID, baristaToken }), {
    wrapper: makeWrapper(makeStore()),
  })

describe('getModel', () => {
  it('sends one m3Batch model/get request to the privileged endpoint when logged in', async () => {
    const fetchMock = mockFetch(() => ({ body: { data: minervaModel } }))
    const { result } = renderModelQuery('tok-123')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [url] = fetchedUrls(fetchMock)
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe(
      'http://localhost:3400/api/minerva_local/m3BatchPrivileged'
    )
    expect(parsed.searchParams.get('token')).toBe('tok-123')
    expect(parsed.searchParams.get('intention')).toBe('query')
    expect(JSON.parse(parsed.searchParams.get('requests')!)).toEqual([
      { entity: 'model', operation: 'get', arguments: { 'model-id': MODEL_ID } },
    ])
  })

  it('uses the public m3Batch endpoint without a token', async () => {
    const fetchMock = mockFetch(() => ({ body: { data: minervaModel } }))
    const { result } = renderModelQuery('')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(new URL(fetchedUrls(fetchMock)[0]).pathname).toBe('/api/minerva_local/m3Batch')
  })

  it('returns the envelope `data` unchanged as `raw`, plus the parsed header', async () => {
    mockFetch(() => ({ body: { 'message-type': 'success', data: minervaModel } }))
    const { result } = renderModelQuery('tok-123')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    // The envelope fields stay behind; only `data` is passed on, as-is.
    expect(result.current.data?.raw).toEqual(minervaModel)
    expect(result.current.data?.meta.title).toBe('Wnt signaling pathway')
    expect(result.current.data?.meta.state).toBe('production')
  })

  it('resolves to null when the response has no model data', async () => {
    mockFetch(() => ({ body: { 'message-type': 'error' } }))
    const { result } = renderModelQuery('tok-123')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeNull()
  })

  it('surfaces an HTTP failure as a query error', async () => {
    mockFetch(() => ({ status: 500, body: { message: 'boom' } }))
    const { result } = renderModelQuery('tok-123')
    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toMatchObject({ status: 500 })
    expect(result.current.data).toBeUndefined()
  })
})
