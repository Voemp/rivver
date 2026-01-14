import { eq } from 'drizzle-orm'
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
}
