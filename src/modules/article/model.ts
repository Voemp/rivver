import { t } from 'elysia'
import { DBModel } from '../../database/model'

export namespace ArticleModel {
  const { feedSelect, articleSelect } = DBModel

  export const recommendQuery = t.Object({
    offest: t.Optional(t.Number()),
    limit: t.Number(),
  })
  export type RecommendQuery = typeof recommendQuery.static

  export const recommendResponse = t.Array(t.Object({
    id: articleSelect.id,
    title: articleSelect.title,
    summary: articleSelect.summary,
    enclosure: articleSelect.enclosure,
    pubDate: articleSelect.pubDate,
    feed: t.Object({
      title: feedSelect.title,
      image: feedSelect.image,
    }),
  }))
}