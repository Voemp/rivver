import { t, type TSchema } from 'elysia'

export const ApiResponseModel = {
  success: <T extends TSchema>(dataModel: T) =>
    t.Object({
      success: t.Boolean(),
      data: t.Union([dataModel, t.Null()]),
      error: t.Null(),
    }),
  error: (message?: string, code?: string) => t.Object({
    code: code ? t.Literal(code) : t.String(),
    message: message ? t.Literal(message) : t.String(),
  }),
}

export const res = {
  success: (data: any) => {
    return { success: true, data, error: null }
  },
  error: (message: string, code: string = 'INTERNAL_ERROR') => {
    return { code, message }
  },
} as const
