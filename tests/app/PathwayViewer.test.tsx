import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import PathwayViewer from '@/app/PathwayViewer'
import { minervaModel } from '@tests/fixtures/minervaModel'
import { mockFetch, renderWithProviders } from '@tests/test-utils'

const LOGGED_IN = {
  auth: {
    user: { uri: 'https://orcid.org/0000-0001-0000-0001', token: 'tok' },
    baristaToken: 'tok',
  },
}

const openModel = (modelId = 'gomodel:5b91dbd100002057') =>
  window.history.replaceState(null, '', `/?model_id=${modelId}`)

describe('PathwayViewer', () => {
  it('asks for a model id and fetches nothing when there is none', () => {
    const fetchMock = mockFetch(() => undefined)
    renderWithProviders(<PathwayViewer />)

    expect(screen.getByText('No model ID provided')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows a loading overlay while the model is in flight', () => {
    openModel()
    mockFetch(() => new Promise(() => {}))
    renderWithProviders(<PathwayViewer />)

    expect(screen.getByText('Loading model...')).toBeInTheDocument()
    expect(screen.queryByText('Model not found')).not.toBeInTheDocument()
  })

  it('renders the model bar once the model loads', async () => {
    openModel()
    mockFetch(() => ({ body: { data: minervaModel } }))
    renderWithProviders(<PathwayViewer />, { preloadedState: LOGGED_IN })

    expect(await screen.findByText('Wnt signaling pathway')).toBeInTheDocument()
    expect(screen.queryByText('Loading model...')).not.toBeInTheDocument()
    expect(screen.queryByText('Model not found')).not.toBeInTheDocument()
    expect(document.querySelector('go-gocam-viewer')).toBeInTheDocument()
  })

  it('shows an error when the request fails', async () => {
    openModel()
    mockFetch(() => ({ status: 500 }))
    renderWithProviders(<PathwayViewer />)

    expect(await screen.findByText('Error loading model')).toBeInTheDocument()
  })

  it('says the model was not found when Minerva returns no data', async () => {
    openModel()
    mockFetch(() => ({ body: { 'message-type': 'error' } }))
    renderWithProviders(<PathwayViewer />)

    expect(await screen.findByText('Model not found')).toBeInTheDocument()
  })

  it('warns anonymous users that the view is read-only', () => {
    openModel()
    mockFetch(() => new Promise(() => {}))
    renderWithProviders(<PathwayViewer />)

    expect(screen.getByText(/Not Logged In/)).toBeInTheDocument()
  })

  it('hides the warning for a logged-in user', () => {
    openModel()
    mockFetch(() => new Promise(() => {}))
    renderWithProviders(<PathwayViewer />, { preloadedState: LOGGED_IN })

    expect(screen.queryByText(/Not Logged In/)).not.toBeInTheDocument()
  })
})
