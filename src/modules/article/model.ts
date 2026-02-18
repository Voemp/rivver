import { DBModel } from '@/db/model'
import { t } from 'elysia'

export namespace ArticleModel {
  const { feedSelect, articleSelect } = DBModel

  export const recommendQuery = t.Object({
    offest: t.Optional(t.Number()),
    limit: t.Number(),
  })

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

  export const articleParams = t.Object({
    id: articleSelect.id,
  })

  export const articleResponse = t.Omit(
    articleSelect.schema,
    ['summary', 'contentSnippet', 'embedding'],
  )
}