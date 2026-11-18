import type React from 'react'
import { MantineProvider } from '@mantine/core'
import { mantineTheme } from './@noctua.core/theme/mantineTheme'
import { AuthProvider } from './features/auth/authProvider'
import { useGetAllDataQuery } from './features/users/slices/metadataApiSlice'
import Layout from './app/layout/Layout'
import PathwayViewer from './app/PathwayViewer'

const App: React.FC = () => {
  // Barista /users + /groups, used only to turn ORCID URIs into names.
  // Deliberately not awaited — the graph shouldn't wait on it.
  useGetAllDataQuery()

  return (
    <MantineProvider theme={mantineTheme}>
      <AuthProvider>
        <Layout>
          <PathwayViewer />
        </Layout>
      </AuthProvider>
    </MantineProvider>
  )
}

export default App
