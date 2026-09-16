import type { StatusMapBack } from 'elysia'

import { res } from '@server/types/response'

export class AppError extends Error {
  override readonly name = 'AppError'
  readonly status: keyof StatusMapBack
  readonly code: string

  constructor(status: keyof StatusMapBack, message: string, code: string = 'INTERNAL_ERROR') {
    super(message)
    this.status = status
    this.code = code
    Object.setPrototypeOf(this, AppError.prototype)
  }

  toResponse() {
    return res.error(this.message, this.code)
  }
}
