import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { defineCustomElements } from '@geneontology/wc-gocam-viz/loader'
import App from './App'
import { store } from './app/store/store'
import '@mantine/core/styles.css'
import './index.css'
import './styles/gocam-viz.css'

// Registers <wc-gocam-viz> before the first render, same as the Angular app's
// src/main.ts. The element is lazily hydrated; GoCamViz waits on whenDefined().
defineCustomElements()

const container = document.getElementById('root')

if (!container) {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file."
  )
}

createRoot(container).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
)
