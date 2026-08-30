import type React from 'react'
import { useEffect } from 'react'
import Toolbar from './Toolbar'
import { initGA, trackPageView } from '@/analytics'

interface LayoutProps {
  children: React.ReactNode
}

/**
 * Header + full-height content. No footer, matching the Angular app's
 * layout-noctua component — the diagram gets the whole viewport.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  useEffect(() => {
    initGA('G-LHBLYRN338')
    trackPageView(window.location.pathname + window.location.search)
  }, [])

  // overflow-hidden so nothing here can ever push the document into scrolling —
  // the single scroll container lives inside PathwayViewer.
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-gray-300">
      <div className="h-12 shrink-0 border-b-2 border-b-primary-500">
        <Toolbar />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  )
}

export default Layout
