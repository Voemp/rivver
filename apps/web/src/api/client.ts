import { env } from '@/config/env'
import { treaty } from '@elysiajs/eden'
import type { App } from '@server/index'

export const appClient = treaty<App>(env.apiBaseUrl, {
  fetch: { credentials: 'include' },
})

export class ApiError extends Error {
  status: number
  detail?: unknown

  constructor(message: string, status: number, detail?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export const unwrapResponse = async <T>(
  payload: Promise<{
    data: T | null
    error: unknown
    status: number
  }>,
  fallbackMessage: string,
): Promise<T> => payload.then((payload) => {
  const { data, error, status } = payload

  if (error || data === null) {
    throw new ApiError(fallbackMessage, status, error)
  }

  return data
})
