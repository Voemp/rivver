import usersRepo from '../../repositories/userRepo'
import { AppError } from '../../utils/error'
import { AuthModel } from './model'

export abstract class AuthService {
  static async signUp({ username, password }: AuthModel.SignBody) {
    const existing = await usersRepo.findByUsername(username)
    if (existing) throw new AppError(409, '用户名已被占用', 'USERNAME_TAKEN')

    const passwordHash = await Bun.password.hash(password)

    return usersRepo.create({ username, passwordHash })
  }

  static async signIn({ username, password }: AuthModel.SignBody) {
    const user = await usersRepo.findByUsername(username)
    if (!user) throw new AppError(401, '用户名或密码错误', 'USERNAME_NOT_FOUND')

    const isMatch = await Bun.password.verify(password, user.passwordHash)
    if (!isMatch) throw new AppError(401, '用户名或密码错误', 'PASSWORD_NOT_MATCH')

    return user
  }
}
