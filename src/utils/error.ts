import { InvertedStatusMap } from 'elysia/utils'
import { res } from '../types/response'

export class AppError extends Error {
  constructor(
    public status: keyof InvertedStatusMap = 500,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message)
    this.name = 'AppError'
  }

  toResponse() {
    return res.error(this.message, this.code)
  }
}
