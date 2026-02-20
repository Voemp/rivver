import { res } from '@server/types/response'
import { InvertedStatusMap } from 'elysia/utils'

export class AppError extends Error {
  readonly name = 'AppError'

  constructor(
    readonly message: string,
    readonly code: string = 'INTERNAL_ERROR',
    readonly status: keyof InvertedStatusMap = 500,
  ) {
    super(message)
  }

  toResponse() {
    return res.error(this.message, this.code)
  }
}
