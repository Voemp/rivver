import { db } from '@server/db'
import { account, session, user, verification } from '@server/db/schema'
import { trustedOrigins } from '@server/utils/cors'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { betterAuth } from 'better-auth/minimal'
import { openAPI } from 'better-auth/plugins'
import type { OpenAPIV3 } from 'openapi-types'

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
  //     clientId: process.env.GOOGLE_CLIENT_ID!,
  //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
    useSecureCookies: process.env.NODE_ENV === 'production',
    trustedProxyHeaders: true,
    database: {
      generateId: 'uuid',
    },
  },
  plugins: [openAPI()],
})

let _schema: ReturnType<typeof auth.api.generateOpenAPISchema> | undefined
const getSchema = () => (_schema ??= auth.api.generateOpenAPISchema())

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const

// better-auth 的 Path 结构与 OpenAPIV3.PathItemObject 结构兼容，但类型来源不同，在边界处转换一次
export const OpenAPI = {
  getPaths: (prefix = '/auth'): Promise<OpenAPIV3.PathsObject> =>
    getSchema().then(({ paths }) => {
      const reference: OpenAPIV3.PathsObject = Object.create(null)

      for (const path of Object.keys(paths)) {
        const pathItem = paths[path] as OpenAPIV3.PathItemObject | undefined
        if (!pathItem) continue

        const key = prefix + path
        reference[key] = pathItem

        for (const method of HTTP_METHODS) {
          const operation = reference[key][method]
          if (!operation) continue

          operation.tags = ['Better Auth']
        }
      }

      return reference
    }),
  components: getSchema().then(({ components }) => components as OpenAPIV3.ComponentsObject),
} as const
