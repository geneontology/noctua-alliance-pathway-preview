import type React from 'react'
import { useEffect, useRef } from 'react'
import type { MinervaModelData } from '../models/model'

const TAG = 'wc-gocam-viz'

type GoCamVizElement = HTMLElement & {
  setModelData: (model: unknown) => Promise<void>
  componentOnReady?: () => Promise<unknown>
}

interface GoCamVizProps {
  /** Untransformed Minerva payload — the web component parses it itself. */
  raw: MinervaModelData | null
}

/**
 * Thin wrapper around the `<wc-gocam-viz>` Stencil element.
 *
 * `gocamId` / `apiUrl` are deliberately left unset: setting `gocamId` makes the
 * component fetch from the public GO API on its own, which would bypass Barista
 * and render the last *published* model rather than what's in Minerva now.
 * Data only ever arrives through `setModelData`.
 */
const GoCamViz: React.FC<GoCamVizProps> = ({ raw }) => {
  const ref = useRef<GoCamVizElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !raw) return

    let cancelled = false

    // The element is lazily defined by `defineCustomElements()`, so the model
    // can resolve before `setModelData` exists on the instance. Wait for both
    // the definition and the component's own first render.
    const run = async () => {
      await customElements.whenDefined(TAG)
      await el.componentOnReady?.()
      if (!cancelled) await el.setModelData(raw)
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [raw])

  return <wc-gocam-viz ref={ref} />
}

export default GoCamViz
