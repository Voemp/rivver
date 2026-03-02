import { db } from '@server/db'
import { article, InsertArticle, SelectArticle } from '@server/db/schema'
import { subDays } from 'date-fns'
import { eq, sql } from 'drizzle-orm'

export const articleRepo = {
  create: async (newArticle: InsertArticle) => {
    return db
      .insert(article)
      .values(newArticle)
      .onConflictDoNothing()
      .returning()
  },
  update: async (id: number, newArticle: Partial<InsertArticle>) => {
    return db
      .update(article)
      .set(newArticle)
      .where(
        eq(article.id, id),
      )
      .returning()
  },
  findById: async (id: number) => {
    return db.query.article.findFirst({
      columns: {
        summary: false,
        contentSnippet: false,
        embedding: false,
      },
      where: { id },
    })
  },
  findByGuidOrLink: async (key: string): Promise<SelectArticle | undefined> => {
    return db.query.article.findFirst({
      where: {
        OR: [{ guid: key }, { link: key }],
      },
    })
  },
  listPopular: async (pageNumber: number, pageSize: number) => {
    return db.query.article.findMany({
      columns: {
        id: true,
        title: true,
        summary: true,
        enclosure: true,
        pubDate: true,
      },
      where: {
        pubDate: { gte: subDays(new Date(), 14) },
      },
      with: {
        feed: {
          columns: {
            title: true,
            image: true,
          },
        },
      },
      orderBy: {
        readCount: 'desc',
        pubDate: 'desc',
      },
      offset: pageNumber,
      limit: pageSize,
    })
  },
  listByUserInterest: async (interestVector: number[]) => {
    return db.query.article.findMany({
      where: {
        pubDate: { gte: subDays(new Date(), 14) },
        embedding: { isNotNull: true },
      },
      orderBy: t => sql`${t.embedding} <=> ${interestVector}::vector`,
      limit: 200,
    }).then(rows => rows.map(r => r.id))
  },
  listByIds: async (ids: number[]) => {
    return db.query.article.findMany({
      columns: {
        id: true,
        title: true,
        summary: true,
        enclosure: true,
        pubDate: true,
      },
      where: {
        id: { in: ids },
      },
      with: {
        feed: {
          columns: {
            title: true,
            image: true,
          },
        },
      },
    })
  },
} as const
