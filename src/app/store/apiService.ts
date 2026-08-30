import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Every endpoint in this app targets an absolute Barista URL (built by
// `getBaristaApiUrl`), so there is no shared base to configure here.
export const apiService = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '' }),
  endpoints: () => ({}),
  reducerPath: 'apiService',
})

export default apiService
