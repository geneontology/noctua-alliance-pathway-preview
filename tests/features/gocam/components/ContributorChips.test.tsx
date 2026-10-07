import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import ContributorChips from '@/features/gocam/components/ContributorChips'
import type { Contributor } from '@/features/users/models/contributor'
import { renderWithProviders } from '@tests/test-utils'

const ada: Contributor = { uri: 'https://orcid.org/0000-0001-0000-0001', name: 'Ada Lovelace' }
const alan: Contributor = { uri: 'https://orcid.org/0000-0001-0000-0002', name: 'Alan Turing' }
const grace: Contributor = { uri: 'https://orcid.org/0000-0001-0000-0003', name: 'Grace Hopper' }
const unnamed: Contributor = { uri: 'https://orcid.org/0000-0001-0000-0009' }

describe('ContributorChips', () => {
  it('shows every contributor when there are two or fewer', () => {
    renderWithProviders(<ContributorChips contributors={[ada, alan]} />)

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument()
    expect(screen.getByText('Alan Turing')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /more/ })).not.toBeInTheDocument()
  })

  it('collapses the rest into a "+N more" menu', async () => {
    const { user } = renderWithProviders(<ContributorChips contributors={[ada, alan, grace]} />)

    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+1 more' }))
    expect(await screen.findByText('Grace Hopper')).toBeInTheDocument()
  })

  it('closes the overflow menu on Escape', async () => {
    const { user } = renderWithProviders(<ContributorChips contributors={[ada, alan, grace]} />)

    await user.click(screen.getByRole('button', { name: '+1 more' }))
    await screen.findByText('Grace Hopper')
    await user.keyboard('{Escape}')

    expect(screen.queryByText('Grace Hopper')).not.toBeInTheDocument()
  })

  it('shows the ORCID URI for a contributor /users does not know', () => {
    renderWithProviders(<ContributorChips contributors={[unnamed]} />)

    expect(screen.getByText(unnamed.uri)).toBeInTheDocument()
  })
})
