import { t, TSchema } from 'elysia'

export namespace ApiResponseModel {
  export const success = <T extends TSchema>(dataModel: T) =>
    t.Object({
      success: t.Boolean(),
      data: t.Union([dataModel, t.Null()]),
      error: t.Null(),
    })

  export const error = (message?: string, code?: string) => t.Object({
    code: code ? t.Literal(code) : t.String(),
    message: message ? t.Literal(message) : t.String(),
  })

  export type Success = {
    success: true
    data: any
    error: null
    meta?: any
  }

  export type Error = {
    code: string
    message: string
  }
}

export const res = {
  success: (data: any): ApiResponseModel.Success => {
    return { success: true, data, error: null }
  },
  error: (message: string, code: string = 'INTERNAL_ERROR'): ApiResponseModel.Error => {
    return { code, message }
  },
} as const
