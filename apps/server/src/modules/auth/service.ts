import { auth } from '@server/modules/auth/index'
import { res } from '@server/types/response'
import { Elysia, t } from 'elysia'

export const betterAuth = new Elysia({ name: 'better-auth' })
  .macro({
    auth: {
      resolve: async ({ status, request: { headers } }) => {
        const session = await auth.api.getSession({ headers })

        if (!session) return status(401, res.error('未授权', 'UNAUTHORIZED'))

        return {
          user: session.user,
          session: session.session,
        }
      },
      user: t.Object({ id: t.String({ format: 'uuid' }) }),
    },
  })
