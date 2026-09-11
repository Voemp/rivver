import { env } from '@server/config/env'

export const trustedOrigins = env.TRUSTED_ORIGINS.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
