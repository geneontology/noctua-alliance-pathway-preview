import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import GoCamViz from '@/features/gocam/components/GoCamViz'
import { minervaModel } from '@tests/fixtures/minervaModel'

const setModelData = vi.fn<(model: unknown) => Promise<void>>()

// Stand in for the real Stencil element. GoCamViz waits on
// customElements.whenDefined(), so the tag has to actually be registered.
class FakeGoCamViz extends HTMLElement {
  setModelData = setModelData.mockResolvedValue(undefined)
  componentOnReady = () => Promise.resolve(this)
}

beforeAll(() => {
  customElements.define('wc-gocam-viz', FakeGoCamViz)
})

describe('GoCamViz', () => {
  it('hands the raw Minerva payload to setModelData untransformed', async () => {
    render(<GoCamViz raw={minervaModel} />)

    await waitFor(() => expect(setModelData).toHaveBeenCalledTimes(1))
    // Identity, not deep-equality: the payload must not be copied or reshaped.
    expect(setModelData.mock.calls[0][0]).toBe(minervaModel)
  })

  it('does not call setModelData before a model has loaded', async () => {
    setModelData.mockClear()
    render(<GoCamViz raw={null} />)

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(setModelData).not.toHaveBeenCalled()
  })
})
