import { t, TSchema } from 'elysia'

export namespace ApiResponseModel {
  export const success = <T extends TSchema>(dataModel: T) =>
    t.Object({
      success: t.Boolean(),
      data: t.Union([dataModel, t.Null()]),
      error: t.Null(),
      meta: t.Optional(t.Any()),
    })

  export const error = t.Object({
    success: t.Boolean(),
    data: t.Null(),
    error: t.Object({
      code: t.String(),
      message: t.String(),
    }),
  })

  export type Success = {
    success: true
    data: any
    error: null
    meta?: any
  }

  export type Error = typeof error.static
}

export const res = {
  success: <T>(data: T, meta?: any): ApiResponseModel.Success => ({
    success: true,
    data,
    error: null,
    meta,
  }),
  error: (message: string, code: string = 'INTERNAL_ERROR'): ApiResponseModel.Error => {
    return {
      success: false,
      data: null,
      error: { code, message },
    }
  },
}
