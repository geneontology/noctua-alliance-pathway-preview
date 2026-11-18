import { describe, expect, it } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import ToolbarLinkMenu from '@/features/gocam/components/ToolbarLinkMenu'
import { renderWithProviders } from '@tests/test-utils'

const items = [
  { label: 'First', href: 'https://example.org/1' },
  { label: 'Second', href: 'https://example.org/2' },
]

// jsdom lays everything out at 0x0, so AnchoredMenu leaves its popup at
// `visibility: hidden`, and hidden text gives a link no accessible name.
// Find menu links by their text instead of by role + name.
const menuLink = async (label: string) => (await screen.findByText(label)).closest('a')!

describe('ToolbarLinkMenu', () => {
  it('keeps the menu closed until the button is clicked', () => {
    renderWithProviders(<ToolbarLinkMenu label="VIEW" items={items} />)

    expect(screen.getByRole('button', { name: 'VIEW' })).toBeInTheDocument()
    expect(screen.queryByText('First')).not.toBeInTheDocument()
  })

  it('opens a list of new-tab links', async () => {
    const { user } = renderWithProviders(<ToolbarLinkMenu label="VIEW" items={items} />)

    await user.click(screen.getByRole('button', { name: 'VIEW' }))

    for (const item of items) {
      const link = await menuLink(item.label)
      expect(link).toHaveAttribute('href', item.href)
      expect(link).toHaveAttribute('target', '_blank')
    }
  })

  it('closes after an item is picked', async () => {
    const { user } = renderWithProviders(<ToolbarLinkMenu label="VIEW" items={items} />)

    await user.click(screen.getByRole('button', { name: 'VIEW' }))
    const link = await menuLink('First')
    link.addEventListener('click', e => e.preventDefault())
    await user.click(link)

    await waitFor(() => expect(screen.queryByText('First')).not.toBeInTheDocument())
  })
})
