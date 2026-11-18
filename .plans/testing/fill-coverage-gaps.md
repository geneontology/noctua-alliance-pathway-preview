# Task: Fill the test coverage gaps

**Status:** COMPLETE
**Branch:** dev

## Goal
Tests cover the model fetch, auth setup, the page states, the model bar and the small pure
helpers, with a coverage report available via `npm run test:coverage`.

## Context
- **Related files:** `src/features/gocam/slices/camApiSlice.ts`,
  `src/features/auth/hooks/useAuthSetup.ts`, `src/app/PathwayViewer.tsx`,
  `src/features/gocam/components/{ModelBar,ContributorChips}.tsx`,
  `src/features/users/slices/metadataApiSlice.ts`, `tests/`
- **Triggered by:** coverage review — only `modelMetadata` and `GoCamViz` were tested.

## Current State
- What works now: 8 tests over `modelMetadata.ts` and `GoCamViz.tsx`.
- What's broken/missing: no tests for the API slices, auth hook, page or model bar.
  Unresolved contributors render an empty chip (no URI fallback in `ContributorChips`).

## Steps

### Phase 1: Infrastructure
- [x] `mockFetch` helper; wrap `renderWithProviders` in `MantineProvider`
- [x] `@vitest/coverage-v8` + `test:coverage` script

### Phase 2: Tests
- [x] `camApiSlice` — request URL/body, `{ raw, meta }`, null and error paths
- [x] `metadataApiSlice` — `/users` + `/groups` into the metadata slice
- [x] `useAuthSetup` — URL token, localStorage token, valid/invalid user
- [x] `PathwayViewer` — no id, banner, loading, error, not found, loaded
- [x] `ModelBar` / `ContributorChips` — chips, overflow menu, link menus
- [x] `useModelUrls`, `getStateColor`, `getBaristaApiUrl`

### Phase 3: Fix
- [x] `ContributorChips` falls back to the URI when there's no name

## Recovery Checkpoint
Started and finished 2026-10-06. 50 tests, ~75% statements; remaining gaps are the shell (App, Layout, Toolbar, authProvider, useAuthUrls).
