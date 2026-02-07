import { t } from 'elysia'
import { DBModel } from '../../database/model'

export namespace AuthModel {
  const { userSelect } = DBModel

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

  export const signResponse = t.Object({
    username: userSelect.username,
    token: t.String(),
  })
}
