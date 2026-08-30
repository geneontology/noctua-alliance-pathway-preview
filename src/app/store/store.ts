import { combineSlices, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import apiService from './apiService'
import { authSlice } from '@/features/auth/slices/authSlice'
import { metadataSlice } from '@/features/users/slices/metadataSlice'

const rootReducer = combineSlices({
  auth: authSlice.reducer,
  metadata: metadataSlice.reducer,
  [apiService.reducerPath]: apiService.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const makeStore = (preloadedState?: Partial<RootState>) => {
  const store = configureStore({
    reducer: rootReducer,
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(apiService.middleware),
    preloadedState,
  })
  setupListeners(store.dispatch)
  return store
}

export const store = makeStore()

export type AppStore = typeof store
export type AppDispatch = AppStore['dispatch']
