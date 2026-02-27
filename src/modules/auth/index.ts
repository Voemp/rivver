import jwt from '@elysiajs/jwt'
import usersRepo from '@server/repos/userRepo'
import { AppError } from '@server/utils/error'
import { Elysia, status } from 'elysia'
import { AuthModel } from './model'
import { jwtConfig } from './service'


export const auth = new Elysia({ prefix: '/auth', detail: { tags: ['Auth'] } })
  .use(jwt(jwtConfig))
  .guard({
    body: AuthModel.signBody,
    response: {
      201: AuthModel.signResponse,
    },
  })
  .post('/sign-up', async ({ jwt, body: { username, password } }) => {
    const existing = await usersRepo.findByUsername(username)
    if (existing) throw new AppError(409, '用户名已被占用', 'USERNAME_TAKEN')

    const passwordHash = await Bun.password.hash(password)
    const user = await usersRepo.create({ username, passwordHash })
    const token = await jwt.sign({ sub: user.id })

    return status(201, { username: user.username, token })
  })
  .post('sign-in', async ({ jwt, body: { username, password } }) => {
    const user = await usersRepo.findByUsername(username)
    if (!user) throw new AppError(401, '用户名或密码错误', 'USERNAME_NOT_FOUND')

    const isMatch = await Bun.password.verify(password, user.passwordHash)
    if (!isMatch) throw new AppError(401, '用户名或密码错误', 'PASSWORD_NOT_MATCH')

    const token = await jwt.sign({ sub: user.id })

    return status(201, { username: user.username, token })
  })

