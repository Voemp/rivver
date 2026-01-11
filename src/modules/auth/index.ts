import jwt from '@elysiajs/jwt'
import { Elysia, status } from 'elysia'
import { jwtConfig } from '../../plugins/auth'
import { ApiResponseModel, res } from '../../types/response'
import { AuthModel } from './model'
import { AuthService } from './service'

export const auth = new Elysia({ prefix: '/auth' })
  .use(jwt(jwtConfig))
  .guard({
    body: AuthModel.signBody,
    response: {
      201: ApiResponseModel.success(AuthModel.signResponse),
    },
  })
  .post('/sign-up', async ({ body, jwt }) => {
    const user = await AuthService.signUp(body)
    const token = await jwt.sign({ sub: user.id })

    return status(201, res.success({ username: user.username, token }))
  })
  .post('sign-in', async ({ body, jwt }) => {
    const user = await AuthService.signIn(body)
    const token = await jwt.sign({ sub: user.id })

    return status(201, res.success({ username: user.username, token }))
  })
