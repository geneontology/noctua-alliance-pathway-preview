# Noctua Alliance Pathway Preview

A Noctua workbench that renders a GO-CAM model in the Alliance pathway style.

## Stack

React 19 + TypeScript, Vite, Mantine, Tailwind CSS, Redux Toolkit / RTK Query,
`@geneontology/web-components` (`<go-gocam-viewer>`) for the pathway rendering.

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4204/`. The app
reloads automatically when you change a source file.

```
npm start              # dev server (development mode)
npm run start:staging  # dev server against staging
npm run build          # production build into workbenches/noctua-alliance-pathway-preview/public
npm run build:beta-test
npm test               # vitest
npm run lint
npm run type-check
```

## Workbench build output

`npm run build` writes the bundle to
`workbenches/noctua-alliance-pathway-preview/public`, served by Noctua at
`/workbench/noctua-alliance-pathway-preview/`. The built output is committed so
the workbench can be deployed straight from this repo.
