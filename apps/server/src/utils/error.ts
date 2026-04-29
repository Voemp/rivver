import { res } from '@server/types/response'
import { InvertedStatusMap } from 'elysia/utils'

export class AppError extends Error {
  override readonly name = 'AppError'

  constructor(
    readonly status: keyof InvertedStatusMap,
    override readonly message: string,
    readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toResponse() {
    return res.error(this.message, this.code)
  }
}
