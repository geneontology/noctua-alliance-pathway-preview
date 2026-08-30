import apiService from '@/app/store/apiService'
import { getBaristaApiUrl } from '@/@noctua.core/services/linksService'
import { parseModelMetadata } from '../services/modelMetadata'
import type { MinervaModelData, PathwayModel } from '../models/model'

const addTagTypes = ['model'] as const

interface ModelQueryArg {
  modelId: string
  baristaToken: string
}

interface M3BatchResponse {
  data?: MinervaModelData
}

const camApi = apiService.enhanceEndpoints({ addTagTypes }).injectEndpoints({
  endpoints: builder => ({
    getModel: builder.query<PathwayModel | null, ModelQueryArg>({
      async queryFn({ modelId, baristaToken }, _queryApi, _extraOptions, baseQuery) {
        const baseUrl = getBaristaApiUrl(baristaToken)

        const requests = encodeURIComponent(
          JSON.stringify([
            {
              entity: 'model',
              operation: 'get',
              arguments: { 'model-id': modelId },
            },
          ])
        )

        const result = await baseQuery({
          url: `${baseUrl}?token=${baristaToken}&intention=query&use-reasoner=true&requests=${requests}`,
        })

        if (result.error) return { error: result.error }

        // `data` here is the barista envelope's `data` field — exactly what the
        // Angular app passed as `cam.response._data`. It goes to the web
        // component untransformed; only the header metadata is parsed out.
        const modelData = (result.data as M3BatchResponse | undefined)?.data
        if (!modelData) return { data: null }

        return { data: { raw: modelData, meta: parseModelMetadata(modelData) } }
      },
      providesTags: (_result, _error, { modelId }) => [{ type: 'model', id: modelId }],
    }),
  }),
})

export const { useGetModelQuery } = camApi
