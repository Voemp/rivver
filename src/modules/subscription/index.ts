import { Elysia, status } from 'elysia'
import { authPlugin } from '../../plugins/authPlugin'
import { ApiResponseModel, res } from '../../types/response'
import { SubModel } from './model'
import { SubService } from './service'

export const subscription = new Elysia({
  prefix: '/subscription',
  detail: {
    tags: ['Subscription'],
    security: [{ bearerAuth: [] }],
  },
})
  .use(authPlugin)
  .get('/', async ({ user }) => {
    const subs = await SubService.list(user.id)
    return status(200, res.success(subs))
  }, {
    response: {
      200: ApiResponseModel.success(SubModel.listResponse),
    },
  })
  .post('/', async ({ user, body }) => {
    const sub = await SubService.subscribe(user.id, body)
    return status(201, res.success(sub))
  }, {
    body: SubModel.subBody,
    response: {
      201: ApiResponseModel.success(SubModel.subResponse),
    },
  })
  .delete('/', async ({ user, body }) => {
    const sub = await SubService.unsubscribe(user.id, body)
    return status(200, res.success(sub))
  }, {
    body: SubModel.unsubBody,
    response: {
      200: ApiResponseModel.success(SubModel.unsubResponse),
    },
  })
