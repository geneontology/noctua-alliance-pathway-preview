declare global {
  interface Window {
    global_barista_location?: string
    global_minerva_definition_name?: string
    global_noctua_url?: string
    global_workbench_url?: string
  }
}

// The Noctua shell defines these on `window` when the workbench is embedded.
// Standalone dev falls back to a local Barista/Minerva.
const baristaLocation = window.global_barista_location ?? 'http://localhost:3400'
const minervaDefinitionName = window.global_minerva_definition_name ?? 'minerva_local'
const noctuaUrl = window.global_noctua_url ?? window.location.origin
const workbenchUrl = window.global_workbench_url ?? `${window.location.origin}/workbench/`

const appEnv: AppEnv = (import.meta.env.VITE_APP_ENV ?? 'dev') as AppEnv

export const ENVIRONMENT = {
  appEnv,
  isDev: appEnv === 'dev',
  isBeta: appEnv === 'beta',
  isProd: appEnv === 'prod',

  globalMinervaDefinitionName: minervaDefinitionName,
  globalBaristaLocation: baristaLocation,

  noctuaUrl,
  workbenchUrl,
}

export const EXTERNAL_LINKS = {
  GO_ONTOLOGY_ISSUES: 'https://github.com/geneontology/go-ontology/issues',
  NOCTUA_USERS_GUIDE:
    'https://docs.google.com/document/d/1a5YZBJrnJ9LKJxPVpXk62dJJGpHB2b9zH8-xr_Rm1Vs',
  GO_HOMEPAGE: 'http://geneontology.org/',
  ALLIANCE_GENOME: 'https://www.alliancegenome.org',
  NOCTUA_PRODUCTION: 'http://noctua.geneontology.org/',
}
