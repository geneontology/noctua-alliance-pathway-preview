import type React from 'react'

// `<wc-gocam-viz>` is a Stencil custom element registered at runtime by
// `defineCustomElements()`, so TSX needs the tag declared to accept it.
//
// NOTE: this file must stay a module (the import above is what makes it one).
// The same block in a global script file would *replace* React's types rather
// than augment them, and every `useState`/`FC` import in the app would break.
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'wc-gocam-viz': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'show-legend'?: boolean
      }
    }
  }
}
