import type { MinervaModelData } from '@/features/gocam/models/model'

/**
 * Shape of the `data` field of an m3Batch response — trimmed to what the model
 * bar reads. `individuals`/`facts` are left as empty arrays; nothing in this app
 * inspects them (they go straight to the web component).
 */
export const minervaModel: MinervaModelData = {
  id: 'gomodel:5b91dbd100002057',
  'modified-p': true,
  individuals: [],
  facts: [],
  annotations: [
    { key: 'title', value: 'Wnt signaling pathway' },
    { key: 'state', value: 'production' },
    { key: 'date', value: '2025-11-04' },
    { key: 'comment', value: 'Reviewed at the Nov consortium call' },
    { key: 'comment', value: 'Second comment' },
    { key: 'contributor', value: 'https://orcid.org/0000-0001-0000-0001' },
    { key: 'contributor', value: 'https://orcid.org/0000-0001-0000-0002' },
    { key: 'providedBy', value: 'http://geneontology.org/gomodel/mgi' },
    { key: 'https://w3id.org/biolink/vocab/in_taxon', value: 'NCBITaxon:10090' },
  ],
}
