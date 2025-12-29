import { createMiddleware } from 'hono/factory'
import { jwt as honoJwt } from 'hono/jwt'

export const jwt = createMiddleware((c, next) => {
  const jwtMiddleware = honoJwt({
    secret: c.env.JWT_SECRET,
  })
  return jwtMiddleware(c, next)
})
