import { describe, expect, it } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useModelUrls } from '@/features/gocam/hooks/useModelUrls'

const MODEL_ID = 'gomodel:5b91dbd100002057'
const ORIGIN = window.location.origin

describe('useModelUrls', () => {
  it('returns null until there is a model id', () => {
    expect(renderHook(() => useModelUrls(undefined, 'tok')).result.current).toBeNull()
    expect(renderHook(() => useModelUrls('', 'tok')).result.current).toBeNull()
  })

  it('passes the model id and token to every workbench link', () => {
    const urls = renderHook(() => useModelUrls(MODEL_ID, 'tok-123')).result.current!
    const qs = 'model_id=gomodel%3A5b91dbd100002057&barista_token=tok-123'

    expect(urls.annotationPreview).toBe(`${ORIGIN}/workbench/annpreview?${qs}`)
    expect(urls.visualPathwayEditor).toBe(`${ORIGIN}/workbench/noctua-visual-pathway-editor?${qs}`)
    expect(urls.standardAnnotations).toBe(`${ORIGIN}/workbench/noctua-standard-annotations?${qs}`)
    expect(urls.graphEditor).toBe(`${ORIGIN}/editor/graph/${MODEL_ID}?${qs}`)
  })

  it('leaves the token off when logged out', () => {
    const urls = renderHook(() => useModelUrls(MODEL_ID, null)).result.current!

    expect(urls.visualPathwayEditor).toBe(
      `${ORIGIN}/workbench/noctua-visual-pathway-editor?model_id=gomodel%3A5b91dbd100002057`
    )
  })

  it('builds token-free download links', () => {
    const urls = renderHook(() => useModelUrls(MODEL_ID, 'tok-123')).result.current!

    expect(urls.gpad).toBe(`${ORIGIN}/download/${MODEL_ID}/gpad`)
    expect(urls.owl).toBe(`${ORIGIN}/download/${MODEL_ID}/owl`)
  })
})
