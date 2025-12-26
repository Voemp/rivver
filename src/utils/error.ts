import type { ContentfulStatusCode } from 'hono/utils/http-status'

export class AppError extends Error {
  constructor(
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public statusCode: ContentfulStatusCode = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}
