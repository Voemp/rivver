import { db } from '@server/db'
import { article, InsertArticle, SelectArticle } from '@server/db/schema'
import { subDays } from 'date-fns'
import { and, desc, eq, gte, isNotNull, notInArray, sql } from 'drizzle-orm'

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
  listByUserInterest: async (interestVector: number[], excludedIds: number[] = [], limit = 200) => {
    const vectorLiteral = `[${interestVector.join(',')}]`

    return db
      .select({
        id: article.id,
      })
      .from(article)
      .where(and(
        gte(article.pubDate, subDays(new Date(), 28)),
        isNotNull(article.embedding),
        ...(excludedIds.length > 0 ? [notInArray(article.id, excludedIds)] : []),
      ))
      .orderBy(sql`${article.embedding} <=> ${sql.raw(`'${vectorLiteral}'::vector`)}`)
      .limit(limit)
      .then(rows => rows.map(row => row.id))
  },
  listFallbackForRecommendation: async (excludedIds: number[], limit: number) => {
    return db
      .select({
        id: article.id,
      })
      .from(article)
      .where(and(
        ...(excludedIds.length > 0 ? [notInArray(article.id, excludedIds)] : []),
      ))
      .orderBy(desc(article.readCount), desc(article.pubDate))
      .limit(limit)
      .then(rows => rows.map(row => row.id))
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
