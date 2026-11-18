import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { makeStore } from '@/app/store/store'
import { useAuthSetup } from '@/features/auth/hooks/useAuthSetup'
import { fetchedUrls, makeWrapper, mockFetch } from '@tests/test-utils'

const VALID_USER = {
  token: 'tok-123',
  uri: 'https://orcid.org/0000-0001-0000-0001',
  nickname: 'Ada Lovelace',
  groups: [{ id: 'http://geneontology.org/gomodel/mgi', label: 'MGI' }],
}

const renderAuthSetup = () => {
  const store = makeStore()
  const hook = renderHook(() => useAuthSetup(), { wrapper: makeWrapper(store) })
  return { store, ...hook }
}

describe('useAuthSetup', () => {
  it('takes the token from the URL, stores it, and strips it from the URL', async () => {
    window.history.replaceState(null, '', '/?model_id=gomodel:abc&barista_token=tok-123')
    mockFetch(() => ({ body: VALID_USER }))
    const { store, result } = renderAuthSetup()

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true))
    expect(store.getState().auth.baristaToken).toBe('tok-123')
    expect(localStorage.getItem('barista_token')).toBe('tok-123')
    expect(window.location.search).toBe('?model_id=gomodel:abc')
  })

  it('falls back to the token saved in localStorage', async () => {
    localStorage.setItem('barista_token', 'tok-123')
    const fetchMock = mockFetch(() => ({ body: VALID_USER }))
    const { store, result } = renderAuthSetup()

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true))
    expect(store.getState().auth.baristaToken).toBe('tok-123')
    expect(fetchedUrls(fetchMock)).toEqual(['http://localhost:3400/user_info_by_token/tok-123'])
  })

  it('prefers the URL token over a stale one in localStorage', async () => {
    localStorage.setItem('barista_token', 'old-token')
    window.history.replaceState(null, '', '/?barista_token=tok-123')
    mockFetch(() => ({ body: VALID_USER }))
    const { store, result } = renderAuthSetup()

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true))
    expect(store.getState().auth.baristaToken).toBe('tok-123')
    expect(localStorage.getItem('barista_token')).toBe('tok-123')
  })

  it('maps the Barista user onto the auth slice', async () => {
    localStorage.setItem('barista_token', 'tok-123')
    mockFetch(() => ({ body: VALID_USER }))
    const { store, result } = renderAuthSetup()

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true))
    expect(store.getState().auth.user).toMatchObject({
      token: 'tok-123',
      name: 'Ada Lovelace',
      uri: VALID_USER.uri,
      group: VALID_USER.groups[0],
    })
  })

  it('logs out when Barista returns a user without a token (expired session)', async () => {
    localStorage.setItem('barista_token', 'expired')
    mockFetch(() => ({ body: {} }))
    const { store, result } = renderAuthSetup()

    await waitFor(() => expect(localStorage.getItem('barista_token')).toBeNull())
    expect(store.getState().auth.baristaToken).toBeNull()
    expect(store.getState().auth.user).toBeNull()
    expect(result.current.isLoggedIn).toBe(false)
  })

  it('logs out when the user lookup fails', async () => {
    localStorage.setItem('barista_token', 'tok-123')
    mockFetch(() => ({ status: 500 }))
    const { store, result } = renderAuthSetup()

    await waitFor(() => expect(localStorage.getItem('barista_token')).toBeNull())
    expect(store.getState().auth.baristaToken).toBeNull()
    expect(result.current.isLoggedIn).toBe(false)
  })

  it('makes no request and stays logged out without any token', async () => {
    const fetchMock = mockFetch(() => undefined)
    const { result } = renderAuthSetup()

    await waitFor(() => expect(result.current.isInitialized).toBe(true))
    expect(result.current.isLoggedIn).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
