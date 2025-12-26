import { zValidator as zv } from '@hono/zod-validator'
import { ValidationTargets } from 'hono'
import { ZodObject } from 'zod'

export const zValidator = <T extends ZodObject, Target extends keyof ValidationTargets>(
  target: Target,
  schema: T
) =>
  zv(target, schema, (result, _) => {
    if (!result.success) throw result.error
  })
