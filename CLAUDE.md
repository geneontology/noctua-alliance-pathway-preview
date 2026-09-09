# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Noctua Alliance Pathway Preview — a small React 19 + TypeScript SPA that renders a single
GO-CAM as a read-only diagram. It is a port of the Angular app at
`../noctua-alliance-pathway-preview`, and deploys to the same
`noctua-alliance-pathway-preview` Noctua workbench.

The app does four things and nothing else:

1. read `model_id` and `barista_token` from the query string,
2. resolve the logged-in user from the Barista token,
3. fetch the model from Minerva via a single `m3Batch` `get`/`model` request,
4. hand the **raw** response payload to the `<go-gocam-viewer>` web component.

All rendering, layout and interaction inside the diagram belongs to
[`@geneontology/web-components`](https://github.com/geneontology/web-components) (source
checkout at `../web-components`). This repo is the shell around it. **It never writes to
Minerva.**

Not to be confused with the sibling app `../noctua-visual-pathway-editor` ("VPE"), a full
editor that shares this repo's conventions and supplied most of its boilerplate.

## Commands

- `npm run dev` — dev server on port **4202** (set in `vite.config.ts`)
- `npm run start` — dev server on 4202, host `0.0.0.0`, `development` mode
  (variants: `start:development`, `start:staging`, `start:production`)
- `npm run build` — clean `workbenches/noctua-alliance-pathway-preview/public`, run `tsc`,
  then `vite build --mode production`
- `npm run build:beta-test` — same flow against the `-beta` workbench in `staging` mode
- `npm run test` — Vitest run (only picks up `tests/**/*.test.{ts,tsx}`)
- Single test file: `npx vitest run tests/features/gocam/services/modelMetadata.test.ts`
- `npm run lint` / `lint:fix`, `npm run format`, `npm run type-check`

Environment modes: `development`, `staging`, `production` (via `--mode`), with matching
`.env.*` files. All runtime vars need the `VITE_` prefix. `VITE_OUTPUT_PATH` sets the build
output dir; `VITE_BASE_URL` becomes the injected `<base href>`. After the build the
`workbenchInjectTmpl` plugin renames `index.html` to `inject.tmpl` so the workbench host can
inline it.

## Architecture

### Source layout

- `src/@noctua.core/` — shared bits: `AnchoredMenu`, `Chip`, `usePopover`, the Mantine theme,
  `ENVIRONMENT`/`EXTERNAL_LINKS` constants, and `getBaristaApiUrl`.
- `src/app/` — shell: store (`store/store.ts`), typed hooks (`hooks.ts`), `layout/`
  (Layout + Toolbar; there is deliberately no footer, matching the Angular original) and
  `PathwayViewer.tsx`, the single page.
- `src/features/`
  - `auth/` — Barista token handling, copied unchanged from VPE. `useAuthSetup` reads
    `?barista_token=`, stashes it in `localStorage`, strips it from the URL, and resolves the
    user via `user_info_by_token`.
  - `gocam/` — the model: `slices/camApiSlice.ts` (the one query),
    `services/modelMetadata.ts` (annotation parser), `components/GoCamViz.tsx` (web component
    wrapper) and `components/ModelBar.tsx` (title / state / date / contributors / links).
  - `users/` — Barista `/users` + `/groups`, used only to turn contributor ORCID URIs into
    display names.
- `tests/` — Vitest specs mirroring `src/`; fixtures in `tests/fixtures/`; `renderWithProviders`
  in `tests/test-utils.tsx`; jsdom setup (incl. the `matchMedia` stub Mantine needs) in
  `tests/setup.ts`.

### The one thing to get right

`go-gocam-viewer.setModelData()` takes the **untransformed** `data` object from the m3Batch
response — the one with `id`, `individuals`, `facts`, `annotations`. It runs its own
`bbop-graph-noctua` parse internally. Do not reshape it, and do not port VPE's
`transformGraphData()`; `camApiSlice` returns `{ raw, meta }` so the raw payload reaches the
component byte-for-byte while only the header metadata gets parsed.

`GoCamViz` also leaves the `gocamId` and `apiUrl` props unset on purpose. Setting `gocamId`
makes the component self-fetch from the public GO API, which bypasses Barista and shows the
last *published* model instead of what's in Minerva now.

### State

Redux Toolkit with `combineSlices`. Three reducers only: `auth`, `metadata`, and the RTK
Query `apiService` reducer. There is no dialog/drawer/toast infrastructure here — if you find
yourself adding one, check whether the feature belongs in VPE instead.

`apiService` has an empty `baseUrl`: every endpoint builds an absolute Barista URL through
`getBaristaApiUrl()`.

### API layer

- **Barista / Minerva** — `m3Batch` (or `m3BatchPrivileged` when a token is present) for the
  model; `user_info_by_token` for the user; `/users` and `/groups` for contributor names.
- Barista's location comes from `window.global_barista_location` (injected by the Noctua
  shell), falling back to `http://localhost:3400` for standalone dev.

### Build / bundling

`vite.config.ts` splits `mantine`, `redux`, and `gocam-viewer` (the Stencil bundle plus its
cytoscape/dagre dependencies) into named chunks; the gocam-viewer chunk is ~850 kB and
dominates the build. `rollup-plugin-visualizer` writes `stats-*.html` into the output dir.

## Enforced patterns

- **Typed Redux hooks only** — `useAppDispatch`/`useAppSelector` from `src/app/hooks.ts`.
  Importing `useSelector`/`useDispatch`/`useStore` from `react-redux` is a lint error.
- **`import type`** for type-only imports (`@typescript-eslint/consistent-type-imports`).
- **Path aliases** — `@/*` → `src/*`, `@tests/*` → `tests/*`.
- **UI** — Mantine v9 for components, Tailwind v4 for layout. Tailwind is imported with the
  `important` flag because the Noctua shell loads Bootstrap 3 globally; see the comment at
  the top of `src/index.css` before touching it.
- **No react-router.** One page, two query params, read straight off
  `window.location.search`.
- **Unused parameters** — prefix with `_`.
- `<go-gocam-viewer>` styling lives in `src/styles/go-gocam-viewer.css`. The component
  renders into a shadow root, so Tailwind utilities cannot reach inside it — cross the boundary with the
  documented CSS custom properties and `::part()` only.
- The JSX declaration for `<go-gocam-viewer>` is in `src/types/go-gocam-viewer.d.ts`, which
  **must** stay a module (it has a top-level import). The same `declare module 'react'` block in a
  global script file replaces React's types instead of augmenting them.

## Conventions

- Prettier: no semicolons, single quotes, 2-space indent, trailing comma `es5`, 100-char
  width, `arrowParens: avoid`. Tailwind classes auto-sorted by `prettier-plugin-tailwindcss`.
- PascalCase components, camelCase hooks and utilities.

## Task management

Create and maintain plan files in `.plans/<category>/<task-name>.md` for non-trivial work.
See [.plans/template.md](.plans/template.md) for the full template, recovery-checkpoint
convention, and category folders (`bugfix`, `feature`, `refactor`, `config`, `docs`,
`testing`, `misc`).

## Git commits

- **Never** add `Co-Authored-By: Claude ...` trailers (or any Claude attribution).
- Keep messages short: a one-line subject plus a few brief bullets, not paragraphs.
