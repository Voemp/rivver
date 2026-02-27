import { DBModel } from '@server/db/model'
import { t } from 'elysia'

const { feedSelect, articleSelect } = DBModel

export const ArticleModel = {
  recommendQuery: t.Object({
    offest: t.Optional(t.Number()),
    limit: t.Number(),
  }),
  recommendResponse: t.Array(t.Object({
    id: articleSelect.id,
    title: articleSelect.title,
    summary: articleSelect.summary,
    enclosure: articleSelect.enclosure,
    pubDate: articleSelect.pubDate,
    feed: t.Nullable(t.Object({
      title: feedSelect.title,
      image: feedSelect.image,
    })),
  })),
  articleParams: t.Object({
    id: t.Number(),
  }),
  articleResponse: t.Omit(
    articleSelect.schema,
    ['summary', 'contentSnippet', 'embedding'],
  ),
} as const
