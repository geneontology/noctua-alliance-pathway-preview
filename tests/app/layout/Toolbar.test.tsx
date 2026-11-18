import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import Toolbar from '@/app/layout/Toolbar'
import { EXTERNAL_LINKS } from '@/@noctua.core/data/constants'
import { renderWithProviders } from '@tests/test-utils'

vi.mock('@/features/auth/authProvider', () => ({
  useAuth: () => ({
    isLoggedIn: false,
    isInitialized: true,
    loginUrl: 'https://example.org/login',
    logoutUrl: 'https://example.org/logout',
    noctuaUrl: 'https://example.org/noctua',
  }),
}))

// jsdom lays everything out at 0x0, so AnchoredMenu leaves its popup at
// `visibility: hidden`, and hidden text gives a link no accessible name.
// Find menu links by their text instead of by role + name.
const menuLink = async (label: string) => (await screen.findByText(label)).closest('a')!

describe('Toolbar', () => {
  it('opens the Help menu with a link to the user guide', async () => {
    const { user } = renderWithProviders(<Toolbar />)

    await user.click(screen.getByRole('button', { name: 'Help' }))

    const link = await menuLink("Noctua User's Guide")
    expect(link).toHaveAttribute('href', EXTERNAL_LINKS.NOCTUA_USERS_GUIDE)
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('shows Login when logged out', () => {
    renderWithProviders(<Toolbar />)

    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute(
      'href',
      'https://example.org/login'
    )
  })
})
