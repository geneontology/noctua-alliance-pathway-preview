import type React from 'react'
import { useMemo } from 'react'
import { useAppSelector } from './hooks'
import { selectAuthUser, selectBaristaToken } from '@/features/auth/slices/authSlice'
import { useGetModelQuery } from '@/features/gocam/slices/camApiSlice'
import ModelBar from '@/features/gocam/components/ModelBar'
import GoCamViz from '@/features/gocam/components/GoCamViz'

const PathwayViewer: React.FC = () => {
  // Read once at mount. `useAuthSetup` strips `barista_token` from the URL via
  // history.replaceState, but leaves `model_id` alone.
  const modelId = useMemo(() => new URLSearchParams(window.location.search).get('model_id'), [])

  const user = useAppSelector(selectAuthUser)
  const baristaToken = useAppSelector(selectBaristaToken)
  const isLoggedIn = !!user

  const { data, error, isLoading } = useGetModelQuery(
    { modelId: modelId || '', baristaToken: baristaToken || '' },
    { skip: !modelId }
  )

  if (!modelId) {
    return <div className="p-4">No model ID provided</div>
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!isLoggedIn && (
        <div className="mb-1 flex h-10 w-full shrink-0 items-center justify-center bg-noc-warn px-[10px] text-xs">
          Not Logged In: You can only view existing annotations
        </div>
      )}

      {data?.meta && <ModelBar meta={data.meta} />}

      {/* The one scroll container in the app. Everything above it is fixed
          height and everything outside it is overflow-hidden, so this is the
          only scrollbar the page itself can produce. (The web component still
          renders its own always-on scrollbar on the activities panel — that's
          hard-coded inside its shadow DOM and can't be overridden.) */}
      <div className="relative min-h-0 flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
            Loading model...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="p-4 text-red-500">Error loading model</div>
          </div>
        )}
        {!isLoading && !error && !data && (
          <div className="flex h-full items-center justify-center text-gray-500">
            Model not found
          </div>
        )}
        <GoCamViz raw={data?.raw ?? null} />
      </div>
    </div>
  )
}

export default PathwayViewer
