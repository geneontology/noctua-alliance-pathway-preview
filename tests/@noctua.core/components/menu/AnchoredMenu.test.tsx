import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { MenuItem } from '@/@noctua.core/components/menu/AnchoredMenu'
import { renderWithProviders } from '@tests/test-utils'

describe('MenuItem', () => {
  it('renders a button by default and fires onClick', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(<MenuItem onClick={onClick}>Logout</MenuItem>)

    await user.click(screen.getByRole('button', { name: 'Logout' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('makes the whole row a new-tab link when given an href', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(
      <MenuItem href="https://example.org/guide" onClick={onClick}>
        Guide
      </MenuItem>
    )

    const link = screen.getByRole('link', { name: 'Guide' })
    expect(link).toHaveAttribute('href', 'https://example.org/guide')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()

    link.addEventListener('click', e => e.preventDefault())
    await user.click(link)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders a disabled button, not a link, when disabled', async () => {
    const onClick = vi.fn()
    const { user } = renderWithProviders(
      <MenuItem href="https://example.org" disabled onClick={onClick}>
        Unavailable
      </MenuItem>
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    const button = screen.getByRole('button', { name: 'Unavailable' })
    expect(button).toBeDisabled()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })
})
