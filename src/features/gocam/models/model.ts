import type { Contributor, Group } from '@/features/users/models/contributor'

/**
 * Annotation keys Minerva puts on the model itself. Subset of the set the
 * full Noctua editor handles — this app only reads header metadata.
 */
export enum AnnotationKey {
  TITLE = 'title',
  STATE = 'state',
  DATE = 'date',
  COMMENT = 'comment',
  CONTRIBUTOR = 'contributor',
  PROVIDED_BY = 'providedBy',
}

export interface ModelAnnotation {
  key: string
  value: string
}

/**
 * The raw `data` object from an m3Batch response: `id`, `individuals`, `facts`,
 * `annotations`, `modified-p`. Passed to `wc-gocam-viz.setModelData()` untouched —
 * the web component runs its own bbop-graph parse over it.
 */
export interface MinervaModelData {
  id?: string
  annotations?: ModelAnnotation[]
  [key: string]: unknown
}

/** Header metadata parsed out of the model's own annotations. */
export interface ModelMeta {
  id: string
  title?: string
  state?: string
  date?: string
  comments: string[]
  contributors: Contributor[]
  groups: Group[]
  modified: boolean
}

export interface PathwayModel {
  /** Untransformed Minerva payload, for the web component. */
  raw: MinervaModelData
  /** Parsed header metadata, for the model bar. */
  meta: ModelMeta
}
