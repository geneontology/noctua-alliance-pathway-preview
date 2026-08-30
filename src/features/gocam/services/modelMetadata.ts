import type { Contributor, Group } from '@/features/users/models/contributor'
import type { MinervaModelData, ModelMeta } from '../models/model'
import { AnnotationKey } from '../models/model'

/**
 * Reads the model-level annotations off a raw Minerva payload.
 *
 * Contributors and groups arrive as bare URIs/ids; `resolveContributor` and
 * `resolveGroup` below turn them into display records against the Barista
 * `/users` and `/groups` tables once those have loaded.
 */
export function parseModelMetadata(data: MinervaModelData | null | undefined): ModelMeta {
  const meta: ModelMeta = {
    id: data?.id ?? '',
    comments: [],
    contributors: [],
    groups: [],
    modified: data?.['modified-p'] === true,
  }

  if (!data || !Array.isArray(data.annotations)) return meta

  for (const annotation of data.annotations) {
    switch (annotation?.key) {
      case AnnotationKey.TITLE:
        meta.title = annotation.value
        break
      case AnnotationKey.STATE:
        meta.state = annotation.value
        break
      case AnnotationKey.DATE:
        meta.date = annotation.value
        break
      case AnnotationKey.COMMENT:
        meta.comments.push(annotation.value)
        break
      case AnnotationKey.CONTRIBUTOR:
        meta.contributors.push({ uri: annotation.value })
        break
      case AnnotationKey.PROVIDED_BY:
        meta.groups.push({ id: annotation.value, label: annotation.value })
        break
    }
  }

  return meta
}

/** ORCID URI → known contributor, falling back to the bare URI. */
export function resolveContributor(uri: string, known: Contributor[]): Contributor {
  return known.find(c => c.uri === uri) ?? { uri }
}

/** Group id → known group, falling back to the bare id as its own label. */
export function resolveGroup(id: string, known: Group[]): Group {
  return known.find(g => g.id === id) ?? { id, label: id }
}
