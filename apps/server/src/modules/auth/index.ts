import type { ElysiaOpenAPIConfig } from '@elysia/openapi'

import { db } from '@server/db'
import { account, session, user, verification } from '@server/db/schema'
import { trustedOrigins } from '@server/utils/cors'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import { openAPI, type Path } from 'better-auth/plugins'

import { env } from '../../config/env'

export const auth = betterAuth({
  appName: 'Rivver',
  basePath: '/auth',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  // socialProviders: {
  //   google: {
  //     clientId: env.GOOGLE_CLIENT_ID,
  //     clientSecret: env.GOOGLE_CLIENT_SECRET,
  //   },
  // },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === 'production',
    trustedProxyHeaders: true,
    database: {
      generateId: 'uuid',
    },
  },
  plugins: [openAPI()],
})

type OpenAPIDocumentation = NonNullable<ElysiaOpenAPIConfig['documentation']>
type OpenAPIPaths = NonNullable<OpenAPIDocumentation['paths']>
type OpenAPIComponents = OpenAPIDocumentation['components']

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema> | undefined
const getSchema = () => (_schema ??= auth.api.generateOpenAPISchema())

export const OpenAPI = {
  getPaths: (prefix = '/auth'): Promise<OpenAPIPaths> =>
    getSchema().then(({ paths }) => {
      const reference = Object.create(null) as OpenAPIPaths

      for (const path of Object.keys(paths)) {
        const pathItem = paths[path]
        if (!pathItem) continue

        const key = prefix + path
        reference[key] = pathItem as OpenAPIPaths[keyof OpenAPIPaths]

        for (const method of Object.keys(pathItem) as (keyof Path)[]) {
          const operation = reference[key]?.[method]
          if (!operation) continue

          operation.tags = ['Better Auth']
        }
      }

      return reference
    }),
  components: getSchema().then(({ components }) => components as OpenAPIComponents),
} as const
