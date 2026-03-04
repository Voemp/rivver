import { res } from '@server/types/response'
import { InvertedStatusMap } from 'elysia/utils'

export class AppError extends Error {
  readonly name = 'AppError'

  constructor(
    readonly status: keyof InvertedStatusMap,
    readonly message: string,
    readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toResponse() {
    return res.error(this.message, this.code)
  }
}
