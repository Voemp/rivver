import { subDays } from 'date-fns'
import { eq, sql } from 'drizzle-orm'
import { db } from '../database'
import { article, InsertArticle, SelectArticle } from '../database/schema'

export const articleRepo = {
  create: async (newArticle: InsertArticle) => {
    const [row] = await db
      .insert(article)
      .values(newArticle)
      .onConflictDoNothing()
      .returning()
    return row
  },
  update: async (id: number, newArticle: Partial<InsertArticle>) => {
    await db
      .update(article)
      .set(newArticle)
      .where(
        eq(article.id, id),
      )
      .returning()
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
        pubDate: { gte: subDays(new Date(), 7) },
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
        pubDate: { gte: subDays(new Date(), 7) },
        embedding: { isNotNull: true },
      },
      orderBy: t => sql`${t.embedding} <=> ${interestVector}::vector)`,
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
}
