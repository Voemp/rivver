import { res } from '@server/types/response'
import { InvertedStatusMap } from 'elysia/utils'

export class AppError extends Error {
  readonly name = 'AppError'

  constructor(
    readonly status: keyof InvertedStatusMap = 500,
    readonly message: string,
    readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message)
  }

  toResponse() {
    return res.error(this.message, this.code)
  }
}
