import { t, TSchema } from 'elysia'

export namespace ApiResponseModel {
  export const success = <T extends TSchema>(dataModel: T) =>
    t.Object({
      success: t.Boolean(),
      data: t.Union([dataModel, t.Null()]),
      error: t.Null(),
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
  success: (data: any): ApiResponseModel.Success => {
    return { success: true, data, error: null }
  },
  error: (message: string, code: string = 'INTERNAL_ERROR'): ApiResponseModel.Error => {
    return { success: false, data: null, error: { code, message } }
  },
}
