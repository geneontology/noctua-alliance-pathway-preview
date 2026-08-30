# Task: Port noctua-alliance-pathway-preview from Angular to React in pathway-viewer-react

**Status:** ACTIVE
**Issue:** —
**Branch:** — (this repo is not under git yet)

## Goal

Rebuild the Angular `noctua-alliance-pathway-preview` app in the React boilerplate at
`C:\work\go\pathway-viewer-react`: a VPE-style header with Barista login, a read-only model
info bar, and one `<wc-gocam-viz>` web component fed straight from Minerva. Done = the React
build drops into the `noctua-alliance-pathway-preview` workbench and matches the Angular
app's behaviour, with every unused dependency removed.

## Context

- **Related files:**
  - **Old app (Angular):**
    `C:\work\go\noctua-alliance-pathway-preview\src\app\main\apps\noctua-pathway\noctua-pathway.component.{ts,html,scss}`,
    `src\app\main\apps\noctua-form\cam\cam-toolbar\cam-toolbar.component.html`,
    `src\app\layout\components\toolbar\toolbar.component.html`,
    `src\main.ts`
  - **Donor (VPE):** `C:\work\go\noctua-visual-pathway-editor\src\features\auth\**`,
    `src\app\layout\Toolbar.tsx`, `src\features\gocam\slices\camApiSlice.ts`,
    `src\@noctua.core\**`
  - **Web component source:** `C:\work\go\wc-gocam-viz` (v1.1.2, the version the Angular app ships)
  - **Target:** `C:\work\go\pathway-viewer-react\src\**`, `package.json`, `vite.config.ts`,
    `.env.*`, `workbenches/`, `CLAUDE.md`
- **Triggered by:** user request — modernize the Angular app onto the React stack, keeping
  only what one web component actually needs.

## Current State

**What works now:** nothing runs. The repo is a boilerplate cut of VPE — all config is in
place (Vite 6, Tailwind v4, Mantine v9, ESLint/Prettier, tsconfig, the workbench
`inject.tmpl` build plugin) and the `public/assets` logos/icons are present.

**What's broken/missing:**
- `src/` is down to 5 files (`App.tsx`, `main.tsx`, `index.css`, `analytics.ts`,
  `vite-env.d.ts`), but `App.tsx` and `main.tsx` still import ~20 deleted VPE modules —
  nothing compiles.
- `node_modules` was never installed.
- `.env.*` and `workbenches/` still say `noctua-visual-pathway-editor` while `package.json`
  says `noctua-alliance-pathway-preview`.
- `package.json` carries ~15 dependencies this app will never use.
- No `tests/` dir, though `tsconfig.app.json` has `include: ["src", "tests"]` and
  `npm run test` expects it.
- `CLAUDE.md` describes VPE's architecture, not this app's.

## What the Angular app actually does

Despite ~330 source files and a 90-package dependency list, `noctua-pathway.component.ts`
does exactly four things:

1. read `model_id` + `barista_token` from the query string,
2. resolve the logged-in user from the barista token,
3. fetch the CAM from Minerva via `m3Batch` (`operation: get`, `entity: model`),
4. hand the raw response to `<wc-gocam-viz>` via `setModelData(...)`.

Everything else — the form editor, drawers, jointjs, ngx-graph, the whole `@noctua.form`
library — is dead weight inherited from the Noctua form editor.

## Key finding: what actually goes into `setModelData()`

Angular passes `cam.response?._data`. Tracing `bbop-response-barista`
(`lib/response.js:144` — `this._data = jresp['data']`), `_data` is the **`data` field of the
m3Batch envelope**: the object with `id`, `individuals`, `facts`, `annotations`,
`modified-p`. `wc-gocam-viz`'s `setModelData` feeds it straight into
`bbopGraph.load_data_basic()`
(`wc-gocam-viz/src/globals/@noctua.form/services/graph.service.ts:47`).

So React must pass **`response.data`, untransformed**. VPE's `transformGraphData()`
(`src/features/gocam/services/graphServices.ts`) is *not* needed and must not be ported —
skipping it is the single biggest simplification in this task.

## Decisions (confirmed with user)

| Question | Decision |
| --- | --- |
| Model bar | Title + state + date + contributor chips + `VIEW IN` / `EXPORT AS` menus (read-only half of the Angular `cam-toolbar`) |
| State | Keep Redux Toolkit + RTK Query; copy VPE auth verbatim; store = `auth` + `metadata` + `apiService` |
| Cleanup | Purge unused deps, delete Playwright, keep Vitest + testing-library |
| Workbench | `noctua-alliance-pathway-preview` (+ `-beta`) — drop-in replacement for the Angular build |

## Steps

### Phase 1: Strip and repoint config
- [ ] `package.json` — remove: `@apollo/client`, `graphql-request`,
      `@rtk-query/graphql-request-base-query`, `reactflow`, `dagre`, `graphlib`,
      `@dagrejs/graphlib`, `framer-motion`, `@use-gesture/react`, `react-hook-form`,
      `socket.io-client`, `axios`, `uuid`, `react-router-dom`, `@mantine/notifications`;
      dev-remove `@playwright/test`, `@types/dagre`, `@types/socket.io-client`
- [ ] `package.json` — add `@geneontology/wc-gocam-viz@1.1.2` (version the Angular app ships)
- [ ] `package.json` — drop the `test:e2e*` scripts; set dev port to **4202** (Angular parity)
- [ ] Delete `playwright.config.ts` and `test-results/`
- [ ] `.env.development` / `.env.staging` / `.env.production` — swap every
      `noctua-visual-pathway-editor` → `noctua-alliance-pathway-preview` (`-beta` for
      staging) in `VITE_BASE_URL` and `VITE_OUTPUT_PATH`
- [ ] Rename `workbenches/noctua-visual-pathway-editor{,-beta}` →
      `workbenches/noctua-alliance-pathway-preview{,-beta}`; set both `config.yaml`s to
      `menu-name`/`page-name: "Alliance Pathway Preview"` and the
      `geneontology/alliance-pathway-preview/issues` help link
- [ ] `vite.config.ts` — trim `manualChunks` to the surviving vendors (mantine, redux,
      wc-gocam-viz/cytoscape); `server.port` / `preview.port` → 4202
- [ ] `index.html` — title → "GOCAM Pathway Viewer" (matches the Angular `inject.tmpl`)
- [ ] `npm install` — first install in this repo

### Phase 2: Core plumbing (copy from VPE)
- [ ] Copy `src/app/hooks.ts` and `src/@noctua.core/{theme/mantineTheme.ts,theme/palette.ts,
      hooks/usePopover.ts,components/menu/AnchoredMenu.tsx,components/chip/Chip.tsx}`
- [ ] Copy `src/@noctua.core/data/constants.ts` (drop the GOlr entries) and
      `src/@noctua.core/services/linksService.ts` (`getBaristaApiUrl`)
- [ ] Copy `src/app/store/apiService.ts` **simplified** — VPE sets
      `baseUrl: import.meta.env.VITE_NOCTUA_API_URL` (a var present in no `.env` here) and
      injects an `X-API-Version` header from `?apiVersion=`. Both are VPE-only, and every
      endpoint we keep uses an absolute Barista URL → reduce to
      `createApi({ baseQuery: fetchBaseQuery({ baseUrl: '' }), reducerPath: 'apiService' })`
- [ ] New `src/app/store/store.ts` —
      `combineSlices({ auth, metadata, [apiService.reducerPath]: apiService.reducer })`
      + `apiService.middleware` + `setupListeners`. None of VPE's `serializableCheck`
      exceptions are needed; no dialog slice carries callbacks here

### Phase 3: Auth + header (VPE parity)
- [ ] Copy `src/features/auth/` wholesale, unchanged — `authProvider.tsx`,
      `authServices.ts`, `user.ts`, `hooks/useAuthSetup.ts`, `hooks/useAuthUrls.ts`,
      `slices/authSlice.ts`, `slices/authApiSlice.ts`
- [ ] Copy `src/features/users/{models/contributor.ts,slices/metadataSlice.ts,
      slices/metadataApiSlice.ts}`; drop `metadataApiSlice`'s `getUserInfo` endpoint (it uses
      a relative `/user_info_by_id/` path that breaks without VPE's `baseUrl`)
- [ ] Copy `src/app/layout/Toolbar.tsx` verbatim; relabel `Pathway Editor` → `Pathway Viewer`.
      Env banner, GitHub icon, Help menu, GO + Alliance logos and login/logout via `useAuth()`
      all carry over — the Angular toolbar has an identical set. Logos already exist under
      `public/assets/images/logos/`
- [ ] Copy `src/app/layout/Footer.tsx`; react-router `<Link>` → plain `<a>`

### Phase 4: Model fetch + metadata
- [ ] New `src/features/gocam/models/model.ts` — `ModelMeta` type
- [ ] New `src/features/gocam/services/modelMetadata.ts` (~40 lines) — walk `data.annotations`
      for `title`, `state`, `date`, `comment`, `contributor`, `providedBy`; same key set as
      VPE's `graphServices.ts:370-388`. Copy only the `AnnotationKey` enum from
      `features/gocam/models/operations.ts`, not the Operation machinery. Contributor values
      are ORCID URIs; resolve against `metadata.contributors`, falling back to the raw URI
- [ ] New `src/features/gocam/slices/camApiSlice.ts` — one query, modelled on VPE's
      `getGraphModel` (`camApiSlice.ts:26-54`): same `getBaristaApiUrl(token)` +
      URL-encoded `requests=[{entity:'model',operation:'get',arguments:{'model-id':modelId}}]`
      with `intention=query&use-reasoner=true`. Returns
      `{ raw: result.data.data, meta: parseModelMetadata(result.data.data) }`.
      No mutations, no `baristaSocketService`, no `packet-id` tracking
- [ ] Copy `src/features/gocam/hooks/useModelUrls.ts` and add the missing SAE
      (`noctua-standard-annotations`) entry so the menu matches the Angular one
- [ ] Copy `src/features/gocam/data/stateColors.ts`

### Phase 5: The web component
- [ ] New `src/features/gocam/components/GoCamViz.tsx` — `useRef` on `<wc-gocam-viz>`,
      `useEffect` → `ref.current.setModelData(raw)`
- [ ] `main.tsx` — call `defineCustomElements()` from `@geneontology/wc-gocam-viz/loader`
      before `createRoot` (mirrors Angular `src/main.ts:11-12`)
- [ ] `vite-env.d.ts` — declare the `wc-gocam-viz` intrinsic element so TS and
      `vite-plugin-checker` accept the tag
- [ ] Leave `gocamId` / `apiUrl` **unset** — setting `gocamId` makes the component self-fetch
      from the public GO API (`gocam-viz.tsx:290`), bypassing Barista and showing stale,
      unsaved models
- [ ] Guard the first call behind `customElements.whenDefined('wc-gocam-viz')` so
      `setModelData` exists if the model resolves before the lazy element upgrades
- [ ] New `src/styles/gocam-viz.css` — port the `--panel-*` / `--activity-*` /
      `--process-label-*` custom-property block and the three `::part(...)` rules verbatim
      from `noctua-pathway.component.scss:6-53`; drop the fixed `width: 1200px` so it fills
      the available area

### Phase 6: Page + shell wiring
- [ ] New `src/features/gocam/components/ModelBar.tsx` — read-only port of the Angular
      `cam-toolbar`, reusing VPE's `Chip`, `ContributorChips`, `ToolbarLinkMenu`,
      `getStateColor`, `useModelUrls`. Layout: title (truncated) · state chip · date chip ·
      contributor chips · spacer · `VIEW IN` (Annotation Preview, VPE, SAE, Graph Editor) ·
      `EXPORT AS` (GPAD, OWL). Omit the edit pencils, comments button and copy-model button
- [ ] Copy `ToolbarLinkMenu.tsx` and `ContributorChips.tsx` from VPE as-is
- [ ] New `src/app/PathwayViewer.tsx` — no `model_id` → "No model ID provided"; not logged in
      → amber "Not Logged In: You can only view existing annotations" banner (port of
      `.noc-not-loggedin`); loading/error inline states; success →
      `<ModelBar meta/>` + `<GoCamViz raw/>`
- [ ] Rewrite `src/app/layout/Layout.tsx` — header (48px fixed) + model bar + flex-1 content
      + footer. No `GroupGuardProvider`, no VPE `CamToolbar`, no right drawer, no
      `LoadingOverlay`
- [ ] Rewrite `src/App.tsx` —
      `<MantineProvider theme><AuthProvider><Layout><PathwayViewer/></Layout></AuthProvider></MantineProvider>`.
      Fire `useGetAllDataQuery()` once here, **non-blocking** — chips show the raw ORCID
      until `/users` resolves. Drop VPE's `SplashScreen` (it gated render on that request)
- [ ] Rewrite `src/main.tsx` — drop `./polyfills/symbolObservable`, `jointjs/dist/joint.css`,
      `@mantine/notifications/styles.css`, `./styles/app-base.css`,
      `./styles/app-components.css`; add `./styles/gocam-viz.css`; remove the doubled
      `StrictMode` (it's currently in both `main.tsx` and `App.tsx`)
- [ ] Drop react-router entirely — one page, two query params. Read `model_id` from
      `new URLSearchParams(window.location.search)` in `PathwayViewer`; `Layout` renders
      `children` instead of `<Outlet>`
- [ ] `index.css` — keep the Tailwind `important` import, the `@theme` palette and the
      Bootstrap-3 reset (all still needed inside the Noctua shell); drop rules that target
      removed components

### Phase 7: Tests + docs
- [ ] Create `tests/setup.ts` (jsdom + the `matchMedia` stub Mantine needs) and
      `tests/test-utils.tsx` (`renderWithProviders`) — trimmed copies from VPE.
      `tsconfig.app.json` has `include: ["src", "tests"]`, so `tsc` errors until this exists
- [ ] `tests/features/gocam/services/modelMetadata.test.ts` — annotation parsing over a
      fixture derived from
      `noctua-visual-pathway-editor/src/@noctua.core/data/examples/simpleModel.json`
- [ ] `tests/features/gocam/components/GoCamViz.test.tsx` — asserts `setModelData` gets the
      raw payload (stub the custom element)
- [ ] Rewrite `CLAUDE.md` — it currently documents VPE (relations decision tree, GOlr search,
      jointjs, 9 reducers) and is wrong for this app in nearly every section

## Target `src/` tree

Files marked *(copy)* need only import-path edits.

```
src/
  main.tsx                                   rewrite
  App.tsx                                    rewrite
  index.css                                  trim
  analytics.ts                               keep as-is
  vite-env.d.ts                              + JSX decl for <wc-gocam-viz>
  styles/gocam-viz.css                       new

  @noctua.core/
    data/constants.ts                        copy, drop golr entries
    theme/{mantineTheme,palette}.ts          copy
    services/linksService.ts                 copy
    hooks/usePopover.ts                      copy
    components/menu/AnchoredMenu.tsx         copy
    components/chip/Chip.tsx                 copy

  app/
    hooks.ts                                 copy
    store/apiService.ts                      copy, simplified
    store/store.ts                           new (3 reducers)
    layout/Layout.tsx                        new, simplified
    layout/Toolbar.tsx                       copy, retitled
    layout/Footer.tsx                        copy, <Link> → <a>
    PathwayViewer.tsx                        new

  features/
    auth/**                                  copy whole folder, unchanged
    users/{models/contributor,slices/metadataSlice,slices/metadataApiSlice}
    gocam/
      models/model.ts                        new
      services/modelMetadata.ts              new
      slices/camApiSlice.ts                  new
      hooks/useModelUrls.ts                  copy + SAE link
      data/stateColors.ts                    copy
      components/{ModelBar,GoCamViz}.tsx     new
      components/{ToolbarLinkMenu,ContributorChips}.tsx   copy
```

**Not ported from VPE:** `features/pathway`, `features/relations`, `features/search`, every
form/dialog/drawer/toast/loading-overlay, `polyfills/symbolObservable.ts`,
`styles/app-base.css`, `styles/app-components.css`.

## Verification

1. `npm install` — confirm `@geneontology/wc-gocam-viz` resolves with no React 19 peer conflicts
2. `npm run type-check` and `npm run lint` — clean
3. `npm run test` — new specs pass
4. `npm run dev`, then open
   `http://localhost:4202/?model_id=gomodel:<id>&barista_token=<token>` against a running
   Barista/Minerva and verify, in order:
   - logged-out load renders the graph plus the amber view-only banner
   - with a token, the header shows name + group; Logout redirects to Barista
   - the model bar shows title/state/date and **named** (not ORCID) contributors
   - `VIEW IN` / `EXPORT AS` open the right workbenches and download URLs
   Screenshot for a side-by-side against the Angular app
5. `npm run build` — output lands in `workbenches/noctua-alliance-pathway-preview/public`,
   `index.html` was renamed to `inject.tmpl`, and the emitted `<base href>` is
   `/workbench/noctua-alliance-pathway-preview/`
6. Compare the built bundle size against the Angular `main.*.js` — a large drop is the
   headline result of this port

## Recovery Checkpoint

> **⚠ UPDATE THIS AFTER EVERY CHANGE**

- **Last completed action:** Phases 1–7 implemented. `tsc`, `eslint`, `vitest` (8 tests) and
  `npm run build` all clean; dev server verified serving on 4202.
- **Next immediate action:** verification step 4 — load
  `http://localhost:4202/workbench/noctua-alliance-pathway-preview/?model_id=<id>&barista_token=<token>`
  against a live Barista/Minerva and confirm the graph renders. This is the only step not yet
  done; it needs credentials, not code.
- **Recent commands run:**
  - `npm install` (705 packages, exit 0, no React 19 peer conflicts)
  - `npx tsc --noEmit -p tsconfig.app.json`
  - `npx eslint .`
  - `npx vitest run`
  - `npm run build`
  - `npx vite --port 4202` (still running in the background)
- **Uncommitted changes:** everything — see Files Modified
- **Environment state:** `node_modules` installed; dev server running on port 4202; a
  production build sits in `workbenches/noctua-alliance-pathway-preview/public`; repo is
  still not under git

## Failed Approaches

| What was tried | Why it failed | Date |
| -------------- | ------------- | ---- |
| Putting the `<wc-gocam-viz>` JSX declaration in `src/vite-env.d.ts` | That file is a global *script* (no top-level import), so `declare module 'react'` **replaced** `@types/react` instead of augmenting it — ~40 errors, every `useState`/`FC`/`ReactNode` import broke. Moved to `src/types/wc-gocam-viz.d.ts`, which has a top-level import and is therefore a module. | 2026-08-16 |

## Files Modified

| File | Action | Status |
| ---- | ------ | ------ |
| `package.json` | 15 deps removed, `@geneontology/wc-gocam-viz@1.1.2` added, e2e scripts dropped | done |
| `.env.development` / `.env.staging` / `.env.production` | repointed to `noctua-alliance-pathway-preview` | done |
| `workbenches/noctua-alliance-pathway-preview{,-beta}/config.yaml` | renamed dirs + retitled | done |
| `vite.config.ts` | chunks trimmed, ports → 4202, unused `command` arg dropped | done |
| `.eslintrc.json` | added `tsconfig.node.json` to `project`, `workbenches` to `ignorePatterns` | done |
| `.prettierrc.json` | `tailwindConfig` → `tailwindStylesheet` (v3 → v4 option) | done |
| `index.html` | title → GOCAM Pathway Viewer | done |
| `playwright.config.ts`, `test-results/` | deleted | done |
| `src/@noctua.core/**` | copied from VPE; `constants.ts` written fresh (golr + footer links dropped) | done |
| `src/app/store/{apiService,store}.ts` | written fresh, 3 reducers | done |
| `src/app/{hooks.ts,layout/Toolbar.tsx}` | copied; Toolbar retitled + dead `brown`/`mauve` classes fixed | done |
| `src/app/{layout/Layout.tsx,PathwayViewer.tsx}` | written fresh | done |
| `src/app/layout/Footer.tsx` | copied, then **deleted** — the Angular layout never renders one | done |
| `src/features/auth/**` | copied unchanged except a `replaceState(null, null, …)` type fix | done |
| `src/features/users/**` | copied; `metadataApiSlice` trimmed to `/users` + `/groups` | done |
| `src/features/gocam/**` | `models/model.ts`, `services/modelMetadata.ts`, `slices/camApiSlice.ts`, `components/{GoCamViz,ModelBar}.tsx` fresh; `useModelUrls` (+ SAE), `stateColors`, `ToolbarLinkMenu`, `ContributorChips` copied | done |
| `src/{main.tsx,App.tsx,index.css,vite-env.d.ts}` | rewritten / trimmed | done |
| `src/types/wc-gocam-viz.d.ts`, `src/styles/gocam-viz.css` | new | done |
| `tests/**` | `setup.ts`, `test-utils.tsx`, `fixtures/minervaModel.ts`, 2 specs | done |
| `CLAUDE.md` | rewritten for this app | done |

## Blockers

- None. Verification step 4 needs a reachable Barista/Minerva plus a `barista_token`; unit
  tests and the build do not.

## Notes

- **Do not port `transformGraphData()`.** The web component wants the raw Minerva `data`
  object and does its own bbop parsing.
- `useAuthSetup` calls `removeBaristaTokenFromUrl()`, which `history.replaceState`s the
  token out of the URL. It leaves `model_id` intact, so reading that param once at mount is
  safe even without react-router.
- `wc-gocam-viz` is a Stencil build; `defineCustomElements()` with no args worked under the
  Angular workbench base href, so it should be fine under `VITE_BASE_URL` too. Its dbxrefs
  YAML fetch is internal to the component.
- `wc-gocam-viz` pulls in its own cytoscape + dagre — that's why `dagre`/`graphlib` can be
  dropped from our direct deps without losing layout.
- `C:\work\go\wc-gocam-viz` holds the source of the exact version (1.1.2) the Angular app
  ships, if behaviour ever needs checking.

## Lessons Learned

- The boilerplate carried three latent config bugs from VPE that only surfaced once the app
  actually compiled: `.prettierrc.json` pointing at a Tailwind **v3** `tailwind.config.js`
  that doesn't exist under v4 (so `npm run format` always crashed), `.eslintrc.json`
  listing only `tsconfig.app.json` (so `vite.config.ts` couldn't be parsed) and ignoring only
  `dist` (so it tried to lint the build output under `workbenches/`). All three are fixed
  here and are worth fixing upstream in VPE too.
- `bg-brown-100` / `bg-mauve-300` in VPE's Toolbar reference palette colors that are defined
  nowhere — the dev/beta toolbar tint has silently never worked. Replaced with `bg-amber-100`.
- The Angular `layout-noctua` component never renders its `noctua-footer`, so the React
  footer was dropped too and the diagram gets the full viewport.

## Summary of the size win

| | Angular | React |
| --- | --- | --- |
| Direct dependencies | 64 runtime + 33 dev | 11 runtime + 20 dev |
| Source files | ~330 | 28 |
| Largest JS chunk | — | `gocam-viz` 857 kB (248 kB gzip), i.e. the web component itself; app code is 222 kB (72 kB gzip) |

## Additional Context (Claude)

**Risks**

1. *Peer deps* — `@geneontology/wc-gocam-viz@1.1.2` is a Stencil 4 dist; framework-agnostic,
   but this is the first time it's paired with React 19 + Vite 6 here. If
   `defineCustomElements()` misresolves its lazy chunks under the workbench base href, the
   fallback is a `<script>` tag against the unpkg bundle (what `C:\work\go\vpe` does).
2. *Shadow DOM* — the component styles itself via CSS custom properties and `::part()`.
   Tailwind utilities can't reach inside it, which is exactly why `styles/gocam-viz.css` has
   to be a faithful port rather than a rewrite.
3. *Contributor names* — barista `/users` is a sizeable payload for a viewer. Firing it
   non-blocking means chips can briefly show ORCID URIs before names land. Acceptable; if it
   looks bad, render the chips only once `metadata` is populated.

**Deferred / out of scope**

- Copy-model, comments and the edit pencils from the Angular `cam-toolbar` — write
  operations, and this app is read-only.
- The `?apiVersion=` / `X-API-Version` mechanism from VPE's `apiService`.
- Barista websocket live-update watching (`useBaristaModelWatch`).

**Observation:** `CLAUDE.md` in this repo is currently a verbatim VPE document. Until Phase 7
rewrites it, treat its Architecture / State Management / Enforced Patterns sections as
describing a different app — Conventions, Commands and Task Management are the only sections
that still apply.
