import { Elysia, status } from 'elysia'
import { auth } from '../../plugins/auth'
import { ApiResponseModel, res } from '../../types/response'
import { SubModel } from './model'
import { SubService } from './service'

const app = new Elysia({ prefix: '/subscription' })
  .use(auth)
  .get('/', async ({ user }) => {
    const subs = await SubService.list(user.id)
    return status(200, res.success(subs))
  })
  .post('/', async ({ body, user }) => {
    const sub = await SubService.subscribe(body, user.id)
    return status(201, res.success(sub))
  }, {
    body: SubModel.subBody,
    response: {
      201: ApiResponseModel.success(SubModel.subResponse),
    },
  })
  .delete('/', async ({ body, user }) => {
    const sub = await SubService.unsubscribe(body, user.id)
    return status(200, res.success(sub))
  }, {
    body: SubModel.unsubBody,
    response: {
      200: ApiResponseModel.success(SubModel.unsubResponse),
    },
  })

export default app
