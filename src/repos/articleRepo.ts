import { db } from '@server/db'
import { article, InsertArticle, SelectArticle, userBehavior } from '@server/db/schema'
import { subDays } from 'date-fns'
import { and, eq, gte, isNotNull, notInArray, sql } from 'drizzle-orm'

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
  listPopularityCandidates: async (excludedIds: number[] = []) => {
    const behaviorScore = db
      .select({
        articleId: userBehavior.articleId,
        totalScore: sql<number>`sum(${userBehavior.score})`.as('totalScore'),
      })
      .from(userBehavior)
      .groupBy(userBehavior.articleId)
      .as('behaviorScore')

    const query = db
      .select({
        id: article.id,
        pubDate: article.pubDate,
        createdAt: article.createdAt,
        totalScore: behaviorScore.totalScore,
      })
      .from(article)
      .leftJoin(behaviorScore, eq(article.id, behaviorScore.articleId))

    if (excludedIds.length > 0) {
      return query.where(notInArray(article.id, excludedIds))
    }

    return query
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
  listByFeedId: async (feedId: number, offset: number, limit: number) => {
    return db.query.article.findMany({
      columns: {
        id: true,
        title: true,
        summary: true,
        enclosure: true,
        pubDate: true,
      },
      where: {
        feedId,
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
        pubDate: 'desc',
      },
      offset,
      limit,
    })
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
