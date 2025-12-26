export type ApiResponse<T = any> = {
  success: boolean
  data: T | null
  error: {
    code: string
    message: string
  } | null
  meta?: any
}

export const res = {
  success: <T>(data: T, meta?: any) => ({
    success: true,
    data,
    error: null,
    meta
  }),

  error: (message: string, code: string = 'INTERNAL_ERROR') => ({
    success: false,
    data: null,
    error: { code, message }
  })
}
