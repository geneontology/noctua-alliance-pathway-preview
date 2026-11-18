import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import ModelBar from '@/features/gocam/components/ModelBar'
import { parseModelMetadata } from '@/features/gocam/services/modelMetadata'
import type { ModelMeta } from '@/features/gocam/models/model'
import type { RootState } from '@/app/store/store'
import { minervaModel } from '@tests/fixtures/minervaModel'
import { renderWithProviders } from '@tests/test-utils'

const meta = parseModelMetadata(minervaModel)

// jsdom lays everything out at 0x0, so AnchoredMenu leaves its popup at
// `visibility: hidden`, and hidden text gives a link no accessible name.
// Find menu links by their text instead of by role + name.
const menuLink = async (label: string) => (await screen.findByText(label)).closest('a')!

const KNOWN_USERS: Partial<RootState> = {
  metadata: {
    contributors: [{ uri: 'https://orcid.org/0000-0001-0000-0001', name: 'Ada Lovelace' }],
    groups: [],
    loading: false,
  },
}

describe('ModelBar', () => {
  it('shows the title, state and date', () => {
    renderWithProviders(<ModelBar meta={meta} />)

    expect(screen.getByTitle('Wnt signaling pathway')).toHaveTextContent('Wnt signaling pathway')
    expect(screen.getByText('production')).toBeInTheDocument()
    expect(screen.getByText('2025-11-04')).toBeInTheDocument()
  })

  it('omits the chips the model has no annotation for', () => {
    const bare: ModelMeta = { ...meta, title: undefined, state: undefined, date: undefined }
    renderWithProviders(<ModelBar meta={bare} />)

    expect(screen.queryByText(/Title:/)).not.toBeInTheDocument()
    expect(screen.queryByText('production')).not.toBeInTheDocument()
    expect(screen.queryByText('2025-11-04')).not.toBeInTheDocument()
  })

  it('names contributors that /users knows and falls back to the URI otherwise', () => {
    renderWithProviders(<ModelBar meta={meta} />, { preloadedState: KNOWN_USERS })

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('https://orcid.org/0000-0001-0000-0002')).toBeInTheDocument()
  })

  it('links to the other workbenches with the model id and token', async () => {
    const { user } = renderWithProviders(<ModelBar meta={meta} />, {
      preloadedState: { auth: { user: null, baristaToken: 'tok-123' } },
    })

    await user.click(screen.getByRole('button', { name: 'VIEW IN' }))
    const link = await menuLink('Visual Pathway Editor')

    const href = new URL(link.getAttribute('href')!)
    expect(href.pathname).toBe('/workbench/noctua-visual-pathway-editor')
    expect(href.searchParams.get('model_id')).toBe(meta.id)
    expect(href.searchParams.get('barista_token')).toBe('tok-123')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('lists the viewers in VIEW IN, without the Standard Annotations Editor', async () => {
    const { user } = renderWithProviders(<ModelBar meta={meta} />)

    await user.click(screen.getByRole('button', { name: 'VIEW IN' }))
    await menuLink('Annotation Preview')

    const labels = screen.getAllByRole('link', { hidden: true }).map(a => a.textContent)
    expect(labels).toEqual(['Annotation Preview', 'Visual Pathway Editor', 'Graph Editor'])
    expect(screen.queryByText('Standard Annotations Editor')).not.toBeInTheDocument()
  })

  it('offers GPAD and OWL downloads', async () => {
    const { user } = renderWithProviders(<ModelBar meta={meta} />)

    await user.click(screen.getByRole('button', { name: 'EXPORT AS' }))

    expect(await menuLink('GPAD')).toHaveAttribute(
      'href',
      `${window.location.origin}/download/${meta.id}/gpad`
    )
    expect(await menuLink('OWL')).toHaveAttribute(
      'href',
      `${window.location.origin}/download/${meta.id}/owl`
    )
  })

  it('has no link menus without a model id', () => {
    renderWithProviders(<ModelBar meta={{ ...meta, id: '' }} />)

    expect(screen.queryByRole('button', { name: 'VIEW IN' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'EXPORT AS' })).not.toBeInTheDocument()
  })
})
