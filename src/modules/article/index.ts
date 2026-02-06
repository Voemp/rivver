import { Elysia, status } from 'elysia'
import { authPlugin } from '../../plugins/authPlugin'
import { ApiResponseModel, res } from '../../types/response'
import { ArticleModel } from './model'
import { ArticleService } from './service'

export const article = new Elysia({
  prefix: '/article',
  detail: {
    tags: ['Article'],
    security: [{ bearerAuth: [] }],
  },
})
  .use(authPlugin)
  .get('/recommendation', async ({ user, query }) => {
    const articles = await ArticleService.recommend(user.id, query)
    console.log('articles', articles)
    return status(200, res.success(articles))
  }, {
    query: ArticleModel.recommendQuery,
    response: {
      200: ApiResponseModel.success(ArticleModel.recommendResponse),
    },
  })