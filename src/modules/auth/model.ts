import { t } from 'elysia'
import { db } from '../../database/model'

export namespace AuthModel {
  const { user } = db.insert

  export const signBody = t.Object({
    username: t.String({
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-zA-Z_][a-zA-Z0-9_]*$',
      error: '用户名必须以字母或下划线开头，只能包含字母、数字和下划线',
    }),
    password: t.String({
      minLength: 8,
      maxLength: 20,
    }),
  })
  export type SignBody = typeof signBody.static

  export const signResponse = t.Object({
    username: user.username,
    token: t.String(),
  })
  export type SignResponse = typeof signResponse.static
}
