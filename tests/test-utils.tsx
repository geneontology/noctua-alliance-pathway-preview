import type { RenderOptions } from '@testing-library/react'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import { MantineProvider } from '@mantine/core'
import { vi } from 'vitest'
import type { AppStore, RootState } from '@/app/store/store'
import { makeStore } from '@/app/store/store'
import { mantineTheme } from '@/@noctua.core/theme/mantineTheme'

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>
  store?: AppStore
}

export const makeWrapper = (store: AppStore) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <MantineProvider theme={mantineTheme}>{children}</MantineProvider>
    </Provider>
  )
  return Wrapper
}

export const renderWithProviders = (
  ui: ReactElement,
  extendedRenderOptions: ExtendedRenderOptions = {}
) => {
  const {
    preloadedState = {},
    store = makeStore(preloadedState),
    ...renderOptions
  } = extendedRenderOptions

  return {
    store,
    user: userEvent.setup(),
    ...render(ui, { wrapper: makeWrapper(store), ...renderOptions }),
  }
}

export interface MockResponse {
  status?: number
  body?: unknown
}

/**
 * Stubs global `fetch` with a router: `handler` gets each request URL and
 * returns the response to send, or `undefined` to fail the request. Returning a
 * never-settling promise keeps the request pending. RTK Query's
 * `fetchBaseQuery` calls `fetch` with a `Request`, so read `.url` off it.
 */
export const mockFetch = (
  handler: (url: string) => MockResponse | Promise<MockResponse> | undefined
) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'object' && 'url' in input ? input.url : String(input)
    const res = await handler(url)
    if (!res) throw new TypeError(`Unexpected fetch: ${url}`)
    return new Response(JSON.stringify(res.body ?? null), {
      status: res.status ?? 200,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

/** URLs of every request `fetchMock` has seen, in order. */
export const fetchedUrls = (fetchMock: ReturnType<typeof mockFetch>) =>
  fetchMock.mock.calls.map(([input]) =>
    typeof input === 'object' && 'url' in input ? input.url : String(input)
  )
