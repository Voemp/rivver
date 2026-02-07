import jwt from '@elysiajs/jwt'
import { Elysia } from 'elysia'
import usersRepo from '../../repositories/userRepo'
import { ApiResponseModel, res } from '../../types/response'
import { AppError } from '../../utils/error'
import { AuthModel } from './model'
import { jwtConfig } from './service'

export const auth = new Elysia({ prefix: '/auth', detail: { tags: ['Auth'] } })
  .use(jwt(jwtConfig))
  .guard({
    body: AuthModel.signBody,
    response: {
      201: ApiResponseModel.success(AuthModel.signResponse),
    },
  })
  .post('/sign-up', async ({ jwt, body: { username, password } }) => {
    const existing = await usersRepo.findByUsername(username)
    if (existing) throw new AppError('用户名已被占用', 'USERNAME_TAKEN', 409)

    const passwordHash = await Bun.password.hash(password)
    const user = await usersRepo.create({ username, passwordHash })
    const token = await jwt.sign({ sub: user.id })

    return res.success({ username: user.username, token }, 201)
  })
  .post('sign-in', async ({ jwt, body: { username, password } }) => {
    const user = await usersRepo.findByUsername(username)
    if (!user) throw new AppError('用户名或密码错误', 'USERNAME_NOT_FOUND', 401)

    const isMatch = await Bun.password.verify(password, user.passwordHash)
    if (!isMatch) throw new AppError('用户名或密码错误', 'PASSWORD_NOT_MATCH', 401)

    const token = await jwt.sign({ sub: user.id })

    return res.success({ username: user.username, token }, 201)
  })
