import { DBModel } from '@server/db/model'
import { t } from 'elysia'

const { feedSelect, articleSelect } = DBModel

export const ArticleModel = {
  articleParams: t.Object({
    id: t.Number(),
  }),
  articleResponse: t.Omit(
    articleSelect.schema,
    ['summary', 'contentSnippet', 'embedding'],
  ),
  articleListQuery: t.Object({
    offset: t.Optional(t.Number({ minimum: 0 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 50 })),
  }),
  articleListResponse: t.Array(t.Object({
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
  aiSummaryResponse: t.Object({
    articleId: t.Number(),
    aiSummary: t.String(),
  }),
  favoriteStatusResponse: t.Object({
    favorited: t.Boolean(),
    articleId: t.Number(),
  }),
  behaviorResponse: t.Object({
    recorded: t.Boolean(),
    type: t.UnionEnum(['click', 'read', 'favorite', 'share']),
    articleId: t.Number(),
  }),
  readProgressBody: t.Object({
    progress: t.Number({ minimum: 0, maximum: 100 }),
  }),
  readProgressResponse: t.Object({
    recorded: t.Boolean(),
    articleId: t.Number(),
    progress: t.Number(),
  }),
} as const
