import { ElysiaCustomStatusResponse, status, t, TSchema } from 'elysia'
import { InvertedStatusMap } from 'elysia/utils'

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

function success<T>(data: T): ApiResponseModel.Success
function success<T, const Code extends keyof InvertedStatusMap>(
  data: T,
  code: Code,
): ElysiaCustomStatusResponse<Code, ApiResponseModel.Success>
function success(data: any, code?: any) {
  const body = { success: true, data, error: null }
  return code ? status(code, body) : body
}

function error(message: string, code: string = 'INTERNAL_ERROR'): ApiResponseModel.Error {
  return { success: false, data: null, error: { code, message } }
}

export const res = {
  success,
  error,
}
